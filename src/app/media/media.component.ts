import { Component, OnInit } from '@angular/core';

import io from 'socket.io-client';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit {

  socket: any;
  username = '';
  btnDisableOnline = false;

  onlineusers = [];

  remoteVideo: any;
  localVideo: any;
  yourConn: any;
  stream: any;

  rtc_data: [];

  constructor() {
    this.socket = io('https://social-funda.herokuapp.com/');
   }

  ngOnInit() {
   
    this.socket.on('onlineusers', data => {
      console.log('online user');
      this.onlineusers = data;
      console.log(this.onlineusers);
    });

    this.socket.on('rtc-manager', data => {
      console.log('receive rtc manager.');
      this.rtc_data = data;
      console.log(this.rtc_data);
    })
  }

  goOnline(){
    this.btnDisableOnline = true;
    console.log(this.username);

    this.socket.emit('online', { room: 'global', user: this.username });

    this.btnDisableOnline = false;
  }

  videoCalling(calle) {
  
    this.socket.emit('rtc-manager', {
      type: 'offer',
      caller: this.username,
      calle: calle,
      data: 'offer data'
    });
  }

  audioCalling() {

  }

}
