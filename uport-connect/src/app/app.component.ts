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
  title = 'Decentralized system testing..';
  isLogin = false
  constructor(private router: Router) {
    let self = this;
    uport.onResponse('disclosureReq', function (err,res ) {
      debugger
      if (err) {
        throw err
      }

      console.log("RESPONSE : ", res)

      var json = JSON.stringify(res.payload)
      if (json) {
        localStorage.setItem('did', json)
        self.router.navigate(['/dashboard']);
        self.isLogin = true
      }
    })
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
      networkId: "",
      rpcUrl: "",
      accountType: "",
      expiresIn: 2000,
      verified: [""],
      callbackUrl: ""
    }
    // const reqId = 'disclosureReq'

    uport.requestDisclosure(reqObj)
    //cb
  }
  logout() {
    this.isLogin = false
    localStorage.removeItem("did")
    this.router.navigate(['/']);
  }
}
