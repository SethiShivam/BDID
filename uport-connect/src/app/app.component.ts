// import { Connect } from 'uport-connect';
import { Component } from '@angular/core';
// import Connect from "../../../public/lib/Connect.js"
import { uport } from './app.service'
import { Router } from '@angular/router';
// declare const Connect: any;
// var Connect = require( '../../../../Connect.js')
// function _window(): any {
//   // return the global native browser window object
//   return window;
// }
// declare let window: CustomWindow;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'unitydemo';
  uport
  isLogin = false
  constructor(private router: Router) {

  }
  ngOnInit() {
    if (localStorage.getItem('did')) {
      this.isLogin = true
    }
  }
  login() {
    const reqObj = {
      requested: ['name', 'country', 'email', 'phone'],
      notifications: true,
      networkId : "",
      rpcUrl : "",
      accountType : "",
      expiresIn : 2000,
      verified : [""],
      callbackUrl : ""
    }
   // const reqId = 'disclosureReq'

    uport.requestDisclosure(reqObj)
//cb
    uport.onResponse('disclosureReq',function(res,err){
      if(err)
      {
        throw err
      }

      console.log("RESPONSE : ", res )

      var json = JSON.stringify(res.payload)
      if (json) {
        localStorage.setItem('did', json)
        this.router.navigate(['/dashboard']);
        this.isLogin = true
      }
  })
  }
  logout() {
    this.isLogin = false
    localStorage.removeItem("did")
    this.router.navigate(['/']);
  }
}
