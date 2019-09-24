import { Component, OnInit } from '@angular/core';
import { uport } from '../app.service'
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  data
  constructor(private router: Router) { }

  ngOnInit() {
    this.data = JSON.parse(localStorage.getItem('did'))
  }
  onFirstClaim() {
    // debugger
    // uport.pushTransport(this.data.pushToken,this.data.publicEncKey)
    let verification = {
      exp: (Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60).toString(),
      claim: { 'FirstClaim': { 'ColledgeName': 'Sigma Institute of Eng.','SPI':80 } }
    }
    uport.sendVerification(verification)
  }
  onSecondClaim(){
    this.router.navigate(['/secondClaim']);
  }

}
