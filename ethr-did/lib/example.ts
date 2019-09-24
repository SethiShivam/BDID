// import { DidRegistryContract } from './b-did-resolver/src/register';
// //test resolver is working or not

// import resolve from 'did-resolver'
// var registerResolver = require('./b-did-resolver/src/register.ts')

// registerResolver.default()

// // resolve('did:bdid:0xdca7ef03e98e0dc2b855be647c39abe984fcf21b').then(doc => console.log("aaaaaaaaaaaaaaaa",doc))

// //test server.ts file function one by one

// var EthrDID = require('./server.ts')

// const keyPair = EthrDID.default.generateAddressPrivateKey()
// console.log("keyPair",keyPair)

// // const ethrDid = new EthrDID.default({address: keyPair.address, privateKey: keyPair.privateKey})
// // console.log("ethrDid",ethrDid)



// var Web3 = require('web3') 
// Web3.providers.HttpProvider.prototype.sendAsync = 
// Web3.providers.HttpProvider.prototype.send 
// const provider = new Web3.providers.HttpProvider('http://localhost:8545') 
// const ethrDidwithProvider = new EthrDID.default({ 
// provider, 
// address: keyPair.address, 
// privateKey: keyPair.privateKey 
// }) 

// ethrSigning()
// async function ethrSigning(){ 
// var abc = await ethrDidwithProvider.generateSigningDesignate() 
// console.log('ethrDid', abc) 
// }


const ganache = require("ganache-cli");
import * as Contract from 'truffle-contract'
var DidRegistryContract = require('ethr-did-registry');
import * as Web3 from 'web3'
import BDID from './server';
import register from './b-did-resolver/src/bdid-resolver';
import resolve from 'did-resolver'
var registerResolver = require('./b-did-resolver/src/bdid-resolver.ts')
var designateTypes = require('./b-did-resolver/src/bdid-resolver.ts')
const Ed25519SignatureAuthentication2018 = designateTypes.designateTypes.Ed25519SignatureAuthentication2018

const web3 = new Web3()
main()
async function main() {
    let provider,
        accounts,
        identity,
        owner,
        designate1,
        designate2,
        registry,
        bDid,
        plainDid
    registerResolver.default()
    provider = ganache.provider()
    web3.setProvider(provider);
    const getAccounts = () =>
        new Promise((resolve, reject) =>
            web3.eth.getAccounts((error, accounts) =>
                error ? reject(error) : resolve(accounts)
            )
        )
    accounts = await getAccounts()
    console.log("accounts", accounts)
    identity = accounts[1].toLowerCase()
    owner = accounts[2].toLowerCase()
    designate1 = accounts[3].toLowerCase()
    designate2 = accounts[4].toLowerCase()
    const DidReg = Contract(DidRegistryContract)
    DidReg.setProvider(provider)

    registry = await DidReg.new({
        from: accounts[0],
        gasPrice: 100000000000,
        gas: 4712388
    })

    bDid = new BDID({
        provider,
        registry: registry.address,
        address: identity
    })
    register({ provider, registry: registry.address })
    
    const doc1 = await resolve(bDid.did)
    console.log("after did generated", doc1)


    var firstOwner = await bDid.lookupOwner()
    const doc2 = await resolve(bDid.did)


    console.log("----------------------------------------- Process 1 END ------------------------------------ \n\n")
    console.log("Owner Found", doc2)
    console.log("firstOwner ---------->", firstOwner)
    console.log("----------------------------------------- Process 2 END ------------------------------------ \n\n")
    var changedOwner = await bDid.changeOwner(owner)
    const doc3 = await resolve(bDid.did)
    console.log("after owner changed", doc3 ,"\n\n\n\n\n\n",changedOwner)

    console.log("----------------------------------------- Process 3 END ------------------------------------ \n\n")
    var addDesignate = await bDid.addDesignate(designate1, { expiresIn: 2 })
    const doc4 = await resolve(bDid.did)
    console.log("after add Designate", doc4)

    console.log("Designate --------------------> ", addDesignate)
    console.log("----------------------------------------- Process 4 END ------------------------------------ \n\n")

    var addsignatureAuthenticatedDesignate = await bDid.addDesignate(designate2, { designateType: Ed25519SignatureAuthentication2018, expiresIn: 10 })
    const doc5 = await resolve(bDid.did)
    console.log("after add Signature Authenticated Designate", doc5)


    console.log("----------------------------------------- Process 5 END ------------------------------------ \n\n")


    // -------------------------Excluded ------------------
    // setTimeout(async () => {
    //     const doc6 = await resolve(ethrDid.did)
    //     console.log("after some time", doc6)
    // },3000)
    // -------------------------------Excluded ---------------


    // var deletesecondDesignate = await bDid.revokeDesignate(designate2, { designateType: Ed25519SignatureAuthentication2018 })
    // const doc7 = await resolve(bDid.did)
    // console.log("after delete Signature Authenticated Designate", doc7)

    // var setAttribute = await bDid.setAttribute(
    //     'did/pub/Ed25519/veriKey/base64',
    //     'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
    //     10
    // )
    // const doc8 = await resolve(bDid.did)
    // console.log("after set Attribute", doc8)

    // var setService = await bDid.setAttribute(
    //     'did/svc/HubService',
    //     'https://hubs.uport.me',
    //     10
    // )
    // const doc9 = await resolve(bDid.did)
    // console.log("after set Service", doc9)

    //first generate signing designate and then you are eligible to generate signJWT
    //this func. is generate one designate in pub
    //this func. is generate signer



    // var generateSigningDesignate = (await bDid.generateSigningDesignate()).kp
    // const doc10 = await resolve(bDid.did)
    // console.log("generateSigningDesignate", doc10)
    
    // var signJWT = await bDid.signJWT({ hello: 'world' })
    // console.log("signJWT",signJWT)

    //this is another method to generate signing designate
    //this kp is sending your address and private key
    //and it generate the signer with the use of private key
    // const kp = await BDID.generateAddressPrivateKey()
    // plainDid = new BDID({ ...kp, provider, registry: registry.address })
    //   var signJWT = await bDid.signJWT({ hello: 'world' })
    //   console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^",signJWT)

    // var checkJWT = await bDid.checkJWT(signJWT,generateSigningDesignate.publicKeyBuffer)
    // console.log("checkJWT",checkJWT)
}

