import { Component, OnInit } from '@angular/core';
import Connect from '../../../lib/Connect.js'
const second = new Connect('Second Claim')
@Component({
  selector: 'app-second-claim',
  templateUrl: './second-claim.component.html',
  styleUrls: ['./second-claim.component.css']
})
export class SecondClaimComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    var reqObj = {
      requested: [],
      notifications: true,
      networkId : "",
      rpcUrl : "",
      accountType : "",
      expiresIn : 2000,
      verified: ['FirstClaim'],
      callbackUrl : "",
    }
   second.requestDisclosure(reqObj)
    
    second.onResponse('disclosureReq',function(err){
      throw err
  }).then(res => {
      
      var json = res.payload
      if (json.FirstClaim.SPI > 70) {
        console.log('json',json.FirstClaim)
        let verification = {
          exp: (Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60).toString(),
          claim: { 'SecondClaim': { 'OfficeName': 'Codezeros' } }
        }
        second.sendVerification(verification)
      } else{
        alert('You are not valid For this Job')
        console.log('not valid')
      }

    //   // document.querySelector('#msg').innerHTML = "Congratulations you are now `logged in`.  Here is the response:  " + json
    // })
  })  

  }
}