import base64url from 'base64url'
import { PublicKey } from 'did-resolver'
var ed25519 = require('ed25519');
var nacl = require('tweetnacl')
var publicKey;
export function verifyEd25519(
  data: string,
  signature: string,
  authenticators: PublicKey[]
): PublicKey {
  const signer : PublicKey = authenticators.find(verifySigner);
  
  function verifySigner() {
    return nacl.sign.detached.verify(Buffer.from(data, 'hex'), base64url.toBuffer(signature), publicKey);
  }  
  if (!signer) throw new Error('Signature invalid for JWT')
  return signer
}
type Verifier = (
  data: string,
  signature: string,
  authenticators: PublicKey[]
) => PublicKey
interface Algorithms {
  [name: string]: Verifier
}
const algorithms: Algorithms = {
  Ed25519: verifyEd25519
}

function VerifierAlgorithm(alg: string,publicKeyBuffer): Verifier {
  publicKey = publicKeyBuffer
  const impl: Verifier = algorithms[alg]
  if (!impl) throw new Error(`Unsupported algorithm ${alg}`)
  return impl
}

export default VerifierAlgorithm
