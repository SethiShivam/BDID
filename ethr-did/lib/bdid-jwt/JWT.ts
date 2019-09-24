import VerifierAlgorithm from './verifierAlgorithm'
import SignerAlgorithm from './signerAlgorithm'
import base64url from 'base64url'
import resolve, { DIDDocument, PublicKey } from 'did-resolver'
var nacl = require('tweetnacl')

export type Signer = (data: string) => Promise<string>
export type SignerAlgorithm = (
  payload: string,
  signer: Signer
) => Promise<string>

interface JWTOptions {
  issuer: string
  signer: Signer
  alg?: string
  expiresIn?: number
}

interface JWTVerifyOptions {
  auth?: boolean
  audience?: string
  callbackUrl?: string
}

interface DIDAuthenticator {
  authenticators: PublicKey[]
  issuer: string
  doc: DIDDocument
}

interface JWTHeader {
  typ: 'JWT'
  alg: string
}

interface JWTPayload {
  iss?: string
  sub?: string
  aud?: string
  iat?: number
  type?: string
  exp?: number
  rexp?: number
}

interface JWTDecoded {
  header: JWTHeader
  payload: JWTPayload
  signature: string
  data: string
}

interface Verified {
  payload: any
  doc: DIDDocument
  issuer: string
  signer: object
  jwt: string
}

interface PublicKeyTypes {
  [name: string]: string[]
}
const SUPPORTED_PUBLIC_KEY_TYPES: PublicKeyTypes = {
  Ed25519: ['Ed25519VerificationKey2018']
}

const defaultAlg = 'Ed25519'

function encodeSection(data: any): string {
  return base64url.encode(JSON.stringify(data))
}

export const IAT_SKEW: number = 300

function isMNID(id: string): RegExpMatchArray {
  return id.match(
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/
  )
}

function isDIDOrMNID(mnidOrDid: string): RegExpMatchArray {
  return mnidOrDid && (mnidOrDid.match(/^did:/) || isMNID(mnidOrDid))
}

export function normalizeDID(mnidOrDid: string): string {
  if (mnidOrDid.match(/^did:/)) return mnidOrDid
  // Backwards compatibility
  if (isMNID(mnidOrDid)) return `did:bdid:${mnidOrDid}`
  throw new Error(`Not a valid DID '${mnidOrDid}'`)
}

export function decodeJWT(jwt: string): JWTDecoded {
  if (!jwt) throw new Error('no JWT passed into decodeJWT')
  const parts: RegExpMatchArray = jwt.match(
    /^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/
  )
  if (parts) {
    return {
      header: JSON.parse(base64url.decode(parts[1])),
      payload: JSON.parse(base64url.decode(parts[2])),
      signature: parts[3],
      data: `${parts[1]}.${parts[2]}`
    }
  }
  throw new Error('Incorrect format JWT')
}

export async function generateJWT(
  payload: object,
  { issuer, signer, alg, expiresIn }: JWTOptions
): Promise<string> {
  if (!signer) throw new Error('No Signer functionality has been configured')
  if (!issuer) throw new Error('No issuing DID has been configured')
  const header: JWTHeader = { typ: 'JWT', alg: alg || defaultAlg }
  const timestamps: Partial<JWTPayload> = {
    iat: Math.floor(Date.now() / 1000),
    exp: undefined
  }
  if (expiresIn) {
    if (typeof expiresIn === 'number') {
      timestamps.exp = timestamps.iat + Math.floor(expiresIn)
    } else {
      throw new Error('JWT expiresIn is not a number')
    }
  }
  const signingInput: string = [
    encodeSection(header),
    encodeSection({ ...timestamps, ...payload, iss: issuer })
  ].join('.')
  const jwtSigner: SignerAlgorithm = SignerAlgorithm(header.alg)
  const signature: string = await jwtSigner(signingInput, signer)
  return [signingInput, signature].join('.')
}

export async function checkJWT(
  jwt: string,
  options: JWTVerifyOptions = { auth: null, audience: null, callbackUrl: null },publicKeyBuffer
): Promise<Verified> {
  const aud: string = options.audience
    ? normalizeDID(options.audience)
    : undefined
  const { payload, header, signature, data }: JWTDecoded = decodeJWT(jwt)

  const {
    doc,
    authenticators,
    issuer
  }: DIDAuthenticator = await resolveAuthenticator(
    header.alg,
    payload.iss,
    options.auth
  )
  const signer: PublicKey = VerifierAlgorithm(header.alg,publicKeyBuffer)(
    data,
    signature,
    authenticators,
  )
  const now: number = Math.floor(Date.now() / 1000)
  if (signer) {
    if (payload.iat && payload.iat > now + IAT_SKEW) {
      throw new Error(
        `JWT not valid yet (issued in the future): iat: ${
          payload.iat
        } > now: ${now}`
      )
    }
    if (payload.exp && payload.exp <= now - IAT_SKEW) {
      throw new Error(`JWT has expired: exp: ${payload.exp} < now: ${now}`)
    }
    if (payload.aud) {
      if (isDIDOrMNID(payload.aud)) {
        if (!aud) {
          throw new Error(
            'JWT audience is required but your app address has not been configured'
          )
        }

        if (aud !== normalizeDID(payload.aud)) {
          throw new Error(
            `JWT audience does not match your DID: aud: ${
              payload.aud
            } !== yours: ${aud}`
          )
        }
      } else {
        if (!options.callbackUrl) {
          throw new Error(
            "JWT audience matching your callback url is required but one wasn't passed in"
          )
        }
        if (payload.aud !== options.callbackUrl) {
          throw new Error(
            `JWT audience does not match the callback url: aud: ${
              payload.aud
            } !== url: ${options.callbackUrl}`
          )
        }
      }
    }
    return { payload, doc, issuer, signer, jwt }
  }
}

export async function resolveAuthenticator(
  alg: string,
  mnidOrDid: string,
  auth?: boolean
): Promise<DIDAuthenticator> {
  const types: string[] = SUPPORTED_PUBLIC_KEY_TYPES[alg]
  if (!types || types.length === 0) {
    throw new Error(`No supported signature types for algorithm ${alg}`)
  }
  const issuer: string = normalizeDID(mnidOrDid)
  const doc: DIDDocument = await resolve(issuer)
  if (!doc) throw new Error(`Unable to resolve DID document for ${issuer}`)
  // is there some way to have authenticationKeys be a single type?
  const authenticationKeys: boolean | string[] = auth
  ? (doc.authentication || []).map(({ publicKey }) => publicKey)
  : true
  const authenticators: PublicKey[] = (doc.publicKey || []).filter(
    async ({ type, id }) =>{
    var verify = await types.find(
      supported =>
      supported === type &&
      (!auth ||
        (Array.isArray(authenticationKeys) &&
        authenticationKeys.indexOf(id) >= 0))
      )
     } )
    if (auth && (!authenticators || authenticators.length === 0)) {
    throw new Error(
      `DID document for ${issuer} does not have public keys suitable for authenticating designate`
    )
  }
  if (!authenticators || authenticators.length === 0) {
    throw new Error(
      `DID document for ${issuer} does not have public keys for ${alg}`
    )
  }
  return { authenticators, issuer, doc }
}

export default { decodeJWT, generateJWT, checkJWT, resolveAuthenticator }
