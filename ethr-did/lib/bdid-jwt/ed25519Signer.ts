
var ed25519 = require('ed25519');
import { Signer } from './JWT';
import base64url from 'base64url';
var nacl = require('tweetnacl')

function Ed25519Signer(base64PrivateKey): Signer {
  var buf = base64PrivateKey
  return async data => {
    return base64url.encode(nacl.sign(Buffer.from(data,'hex'),buf));
  }
}

export default Ed25519Signer
