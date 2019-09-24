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
  async login() {
    const reqObj = {
      requested: ['Name', 'Country', 'Email', 'Phone'],
      notifications: true,
      verified : [],
      callbackUrl : "",
      networkId: "",
       rpcUrl: "",
        accountType: "",
         expiresIn: 1000
    }

 
  
    uport.requestDisclosure(reqObj)


    
      uport.onResponse('disclosureReq',function(res,error){
        console.log('Triggering on Response ')
  
        console.log("inside On Rsponse",res.payload)
        var json = JSON.stringify(res.payload)
        if (json) {
          localStorage.setItem('did', json)
          this.router.navigate(['/dashboard']);
          this.isLogin = true
        }
      })

  

  // console.log("disResponse"disResponse)

   

  
  }
  logout() {
    this.isLogin = false
    localStorage.removeItem("did")
    this.router.navigate(['/']);
  }
}
