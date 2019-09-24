import { registerMethod, DIDResolver, ParsedDID, DIDDocument } from 'did-resolver'
import * as HttpProvider from 'ethjs-provider-http'
import * as Eth from 'ethjs-query'
import * as abi from 'ethjs-abi'
export const BN = require('bn.js')
import * as EthContract from 'ethjs-contract'
export const DidRegistryContract = require('../contracts/b-did-registry.json');
import { Buffer } from 'buffer'
export const REGISTRY = '0x241e67c86f89aa3652dacb6396dc9ded3f7ebc88'

export function bytes32toString(bytes32) {
    return Buffer.from(bytes32.slice(2), 'hex')
        .toString('utf8')
        .replace(/\0+$/, '')
}

export function stringToBytes32(str) {
    const buffstr =
        '0x' +
        Buffer.from(str)
            .slice(0, 32)
            .toString('hex')
    return buffstr + '0'.repeat(66 - buffstr.length)
}

export const designateTypes = {
    Ed25519SignatureAuthentication2018: stringToBytes32('sigAuth'),
    Ed25519VerificationKey2018: stringToBytes32('veriKey'),
}

export const attrTypes = {
    sigAuth: 'SignatureAuthentication2018',
    veriKey: 'VerificationKey2018',
}

export function encloseDidDocument(did, owner, history) {
    const now = new BN(Math.floor(new Date().getTime() / 1000))
    // const expired = {}
    const publicKey = [
        {
            id: `${did}#owner`,
            type: 'Ed25519VerificationKey2018',
            owner: did,
            ethereumAddress: owner,
        },
    ]

    const authentication = [
        {
            type: 'Ed25519SignatureAuthentication2018',
            publicKey: `${did}#owner`,
        },
    ]

    let designateCount = 0
    const auth = {}
    const pks = {}
    const services = {}
    for (let event of history) {
        let validTo = event.validTo
        const key = `${event._eventName}-${event.delegateType ||
            event.name}-${event.delegate || event.value}`
        if (validTo && validTo.gte(now)) {
            if (event._eventName === 'DIDDelegateChanged') {
                designateCount++
                const designateType = bytes32toString(event.delegateType)
                switch (designateType) {
                    case 'sigAuth':
                        auth[key] = {
                            type: 'Ed25519SignatureAuthentication2018',
                            publicKey: `${did}#designate-${designateCount}`,
                        }
                    case 'veriKey':
                        pks[key] = {
                            id: `${did}#designate-${designateCount}`,
                            type: 'Ed25519VerificationKey2018',
                            owner: did,
                            ethereumAddress: event.delegate,
                        }
                        break
                }
            } else if (event._eventName === 'DIDAttributeChanged') {
                const name = bytes32toString(event.name)
                const match = name.match(
                    /^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/
                )
                if (match) {
                    const section = match[1]
                    const algo = match[2]
                    const type = attrTypes[match[4]] || match[4]
                    const encoding = match[6]
                    switch (section) {
                        case 'pub':
                            designateCount++
                            const pk = {
                                id: `${did}#designate-${designateCount}`,
                                type: `${algo}${type}`,
                                owner: did,
                            }
                            switch (encoding) {
                                case null:
                                case undefined:
                                case 'hex':
                                    pk['publicKeyHex'] = event.value.slice(2)
                                    break
                                case 'base64':
                                    pk['publicKeyBase64'] = Buffer.from(
                                        event.value.slice(2),
                                        'hex'
                                    ).toString('base64')
                                    break
                                case 'base58':
                                    pk['publicKeyBase58'] = Buffer.from(
                                        event.value.slice(2),
                                        'hex'
                                    ).toString('base58')
                                    break
                                case 'pem':
                                    pk['publicKeyPem'] = Buffer.from(
                                        event.value.slice(2),
                                        'hex'
                                    ).toString()
                                    break
                                default:
                                    pk['value'] = event.value
                            }
                            pks[key] = pk
                            break
                        case 'svc':
                            services[key] = {
                                type: algo,
                                serviceEndpoint: Buffer.from(
                                    event.value.slice(2),
                                    'hex'
                                ).toString(),
                            }
                            break
                    }
                }
            }
        } else {
            if (
                designateCount > 0 &&
                (event._eventName === 'DIDDelegateChanged' ||
                    (event._eventName === 'DIDAttributeChanged' &&
                        bytes32toString(event.name).match(/^did\/pub\//))) &&
                validTo.lt(now)
            )
                designateCount--
            delete auth[key]
            delete pks[key]
            delete services[key]
        }
    }

    const doc:DIDDocument = {
        '@context': 'https://w3id.org/did/v1',
        id: did,
        publicKey: publicKey.concat(Object['values'](pks)),
        authentication: authentication.concat(Object['values'](auth)),
    }
    if (Object['values'](services).length > 0) {
        doc['service'] = Object['values'](services)
    }

    return doc
}

function configuration(conf = {}) {
    if (conf['provider']) {
        return conf['provider']
    } else if (conf['web3']) {
        return conf['web3'].currentProvider
    } else {
        return new HttpProvider(conf['rpcUrl'] || 'https://mainnet.infura.io/ethr-did')
    }
}

export default function register(conf = {}) {
    const provider = configuration(conf)
    const eth = new Eth(provider)
    const registryAddress = conf['registry'] || REGISTRY
    const DidReg = new EthContract(eth)(DidRegistryContract)
    const didReg = DidReg.at(registryAddress)
    const logDecoder = abi.logDecoder(DidRegistryContract, false)
    const lastChanged = async identity => {
        const result = await didReg.changed(identity)
        if (result) {
            return result['0']
        }
    }
    async function changeLog(identity) {
        const history = []
        let previousChange = await lastChanged(identity)

        while (previousChange) {
            const blockNumber = previousChange
            const logs = await eth.getLogs({
                address: registryAddress,
                topics: [null, `0x000000000000000000000000${identity.slice(2)}`],
                fromBlock: previousChange,
                toBlock: previousChange,
            })
            const events = logDecoder(logs)
            previousChange = undefined
            for (let event of events) {
                history.unshift(event)
                if (event.previousChange.lt(blockNumber)) {
                    previousChange = event.previousChange
                }
            }
        }
        return history
    }

    let resolver: DIDResolver;

    resolver = async function(did: string, parsed: ParsedDID): Promise<null|DIDDocument> {
        if (!parsed.id.match(/^0x[0-9a-fA-F]{40}$/))
            throw new Error(`Not a valid bdid: ${did}`)
        const owner = await didReg.identityOwner(parsed.id)
        const history = await changeLog(parsed.id)
        return encloseDidDocument(did, owner['0'], history)
    }
    registerMethod('bdid', resolver)
}

// module.exports = register