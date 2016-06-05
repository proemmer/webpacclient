// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router-deprecated';
import { WebpacService } from "../../services/webpac.service";
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'login',
  templateUrl: 'app/components/login/login.component.html',
})
export class LoginComponent {

  public loggedIn: boolean = false;
  public username: string = "";
  public password: string = "";

  constructor(
    private _userService: WebpacService,
    private _router: Router
  ) {
    this.loggedIn = _userService.isLoggedIn();
    if (this.loggedIn)
      this._router.navigate(['Home']);
  }

  login() {
    if (!this.loggedIn) {
      this._userService.login(this.username, this.password).subscribe((result) => {
        if (result) {
          this._router.navigate(['Home']);
        } else {
          console.warn("Not logged in");
        }
      });
    }

  }

  logout() {
    if (this.loggedIn) {
      this._userService.logout();
      this.loggedIn = this._userService.isLoggedIn();
    }
  }
}