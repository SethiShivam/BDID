
// import  SimpleSigner  from './bdid-jwt/SimpleSigner';
import Ed25519Signer from './bdid-jwt/ed25519Signer'
import { generateJWT } from "./bdid-jwt/JWT";
import { checkJWT } from './bdid-jwt/JWT';
import * as HttpProvider from 'ethjs-provider-http'
import * as Eth from 'ethjs-query'
import * as EthContract from 'ethjs-contract'
import { Buffer } from 'buffer'
import ed25519 = require('ed25519')
var nacl = require('tweetnacl')
import crypto = require('crypto');
var designateTypes = require('./b-did-resolver/src/bdid-resolver.ts')
var stringToBytes32 = require('./b-did-resolver/src/bdid-resolver.ts')

import { toEthereumAddress } from './bdid-jwt/digest'

var REGISTRY = require('./b-did-resolver/src/bdid-resolver.ts')
var DidRegistryContract = require('./b-did-resolver/contracts/b-did-registry.json')
const Ed25519VerificationKey2018 = designateTypes.designateTypes.Ed25519VerificationKey2018

function configuration(conf = {}) {
  if (conf['provider']) {
    return conf['provider']
  } else if (conf['web3']) {
    return conf['web3'].currentProvider
  } else {
    return new HttpProvider(conf['rpcUrl'] || 'https://mainnet.infura.io/ethr-did')
  }
}

function attributeToHex(key, value) {
  if (Buffer.isBuffer(value)) {
    return `0x${value.toString('hex')}`
  }
  const match = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)
  if (match) {
    const encoding = match[6]
    // TODO add support for base58
    if (encoding === 'base64') {
      return `0x${Buffer.from(value, 'base64').toString('hex')}`
    }
  }
  if (value.match(/^0x[0-9a-fA-F]*$/)) {
    return value
  }
  return `0x${Buffer.from(value).toString('hex')}`
}
//nacl.sign(message, secretKey)
export default class BDID {
  registry;
  address;
  did;
  signer;
  owner;
  constructor(conf = {}) {
    const provider = configuration(conf)
    const eth = new Eth(provider)
    const registryAddress = conf['registry'] || REGISTRY.REGISTRY
    const bdidReg = new EthContract(eth)(DidRegistryContract)
    this.registry = bdidReg.at(registryAddress)
    this.address = conf['address']
    if (!this.address) throw new Error('No address is set for EthrDid')
    this.did = `did:bdid:${this.address}`
    if (conf['signer']) {
      this.signer = conf['signer']
    } else if (conf['privateKey']) {
      this.signer = Ed25519Signer(conf['  ']) //send your private key in the form of buffer
    }
  }

  static generateKeyPair() {


    var Keypair = nacl.sign.keyPair()

    //  var Keypair = ed25519.MakeKeypair(aliceSeed);
  
    // let publicKey = 
    // let privateKey = 
      const privateKey = Buffer.from(Keypair.secretKey).toString('hex')
      const publicKey = Buffer.from(Keypair.publicKey).toString('hex');
      var privateKeyBuffer = Buffer.from(Keypair.secretKey,'hex')
      var publicKeyBuffer = Buffer.from(Keypair.publicKey,'hex')


    // var aliceSeed = crypto.randomBytes(32);
    // var Keypair = ed25519.MakeKeypair(aliceSeed);
    // var privateKeyBuffer = Keypair.privateKey
    // var publicKeyBuffer = Keypair.publicKey
    //const publicKey = privateKey
    //Keypair.publicKey.toString('hex')




    
    const address = toEthereumAddress(publicKey)
    console.log({ address, privateKeyBuffer, publicKeyBuffer })
    return { address, privateKeyBuffer, publicKeyBuffer }
  }

  async lookupOwner(cache = true) {
    if (cache && this.owner) return this.owner
    const result = await this.registry.identityOwner(this.address);
    return result['0']
  }

  async changeOwner(newOwner) {
    const owner = await this.lookupOwner()
    const txHash = await this.registry.changeOwner(this.address, newOwner, {
      from: owner
    })
    this.owner = newOwner
    return txHash
  }

  async addDesignate(designate, options = {}) {
    const designateType = options['designateType'] || Ed25519VerificationKey2018
    const expiresIn = options['expiresIn'] || 86400
    const owner = await this.lookupOwner()

    return this.registry.addDelegate(
      this.address,
      designateType,
      designate,
      expiresIn,
      { from: owner }
    )
  }

  async revokeDesignate(designate, options = {}) {
    const owner = await this.lookupOwner()
    const designateType = options['designateType'] || Ed25519VerificationKey2018
    return this.registry.revokeDelegate(this.address, designateType, designate, {
      from: owner
    })
  }

  async setAttribute(key, value, expiresIn = 86400, gasLimit) {
    const owner = await this.lookupOwner()
    return this.registry.setAttribute(
      this.address,
      stringToBytes32.stringToBytes32(key),
      attributeToHex(key, value),
      expiresIn,
      {
        from: owner,
        gas: gasLimit
      }
    )
  }

  // Generate a temporary signing designate able to sign JWT on behalf of identity
  async generateSigningDesignate(
    designateType = Ed25519VerificationKey2018,
    expiresIn = 86400
  ) {
    const kp = BDID.generateKeyPair()
    this.signer = Ed25519Signer(kp.privateKeyBuffer)

    const txHash = await this.addDesignate(kp.address, {
      designateType,
      expiresIn
    })
    return { kp, txHash }
  }

  async signJWT(payload, expiresIn) {
    if (typeof this.signer !== 'function') {
      throw new Error('No signer configured')
    }
    const options = { signer: this.signer, alg: 'Ed25519', issuer: this.did }
    if (expiresIn) options['expiresIn'] = expiresIn
    return generateJWT(payload, options)
  }

  async checkJWT(jwt, publicKeyBuffer,audience = this.did) {
    return checkJWT(jwt, { audience, auth: true }, publicKeyBuffer)
  }
}

