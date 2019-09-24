import { Signer, SignerAlgorithm } from './JWT'

export function Ed25519Signer(): SignerAlgorithm {
  return async function sign(payload: string, signer: Signer): Promise<string> {
    const signature: string = await signer(payload)
    if (typeof signature == 'string') {
      return signature
    } else {
      throw new Error(
        'expected a signer function that returns a string instead of signature object'
      )
    }
  }
}

interface SignerAlgorithms {
  [alg: string]: SignerAlgorithm
}

const algorithms: SignerAlgorithms = {
  Ed25519: Ed25519Signer()
}

function SignerAlgorithm(alg: string): SignerAlgorithm {
  const impl: SignerAlgorithm = algorithms[alg]
  if (!impl) throw new Error(`Unsupported algorithm ${alg}`)
  return impl
}

export default SignerAlgorithm
