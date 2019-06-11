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
  callename = '';
  btnDisableOnline = false;

  onlineusers = [];

  remoteVideo: any;
  localVideo: any;
  yourConn: any;
  stream: any;

  rtc_data: [];

  // call models / popups
  incomingCallModel: any;
  outgoingCallModel: any;

  isIncomming= false;
  isOutgoing= false;

  constructor() {
    this.socket = io('https://social-funda.herokuapp.com/');
  }

  ngOnInit() {

    this.socket.on('onlineusers', data => {
      console.log('online user');
      this.onlineusers = data;
      console.log(this.onlineusers);
    });

    this.remoteVideo = document.querySelector('#remoteVideo');
    this.localVideo = document.querySelector('#localVideo');

    this.incomingCallModel = document.getElementById('#incommingCallModel');
    this.outgoingCallModel = document.getElementById('#outgoingCallModel');
    

    this.socket.on('rtc-manager', data => {
      this.rtc_data = data;

      switch (data.type) {
        case 'offer':
          console.log('offer received.');
          if (data.calle != null && data.calle === this.username) {
            console.log('this offer for me');
            this.openIncommingCallPopup();
          //  this.handleOffer(data);
          }
          break;
        case 'answer':
          if (data.caller != null && data.calle === this.username) {
            console.log('this answer for me');
            this.handleAnswer(data);
          }
          break;
        case 'candidate':
          console.log('this candidate for me');
          this.handleCandidate(data);
          break;
        case 'leave':
          this.handleLeave();
          break;
        case 'cancel':

          break;
        default:

          break;
      }

    })
  }

  goOnline() {
    this.btnDisableOnline = true;
    console.log(this.username);

    this.socket.emit('online', { room: 'global', user: this.username });

    this.btnDisableOnline = false;
  }

  videoCalling(calle) {

    this.callename = calle;
    this.openOutgoingCallPopup();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(myStream => {
      this.stream = myStream;
      //            video.src = stream;
      if ('srcObject' in this.localVideo) {
        this.localVideo.srcObject = this.stream;
      } else {
        // Avoid using this in new browsers, as it is going away.
        this.localVideo.src = URL.createObjectURL(this.stream);
      }



      this.yourConn = new webkitRTCPeerConnection(this.configuration);

      // setup stream listening 
      this.yourConn.addStream(this.stream);

      //when a remote user adds stream to the peer connection, we display it 
      this.yourConn.onaddstream = function (e) {
        if ('srcObject' in this.remoteVideo) {
          this.remoteVideo.srcObject = e.stream;
        } else {
          // Avoid using this in new browsers, as it is going away.
          this.remoteVideo.src = URL.createObjectURL(e.stream);
        }
      };

      // Setup ice handling 
      this.yourConn.onicecandidate = function (event) {

        if (event.candidate) {
          this.socket.emit('rtc-manager', {
            type: 'candidate',
            caller: this.username,
            calle: calle,
            data: event.candidate
          });
        }

      };

      // create an offer 
      this.yourConn.createOffer(function (offer) {
        this.socket.emit('rtc-manager', {
          type: 'offer',
          caller: this.username,
          calle: calle,
          data: offer
        });

        this.yourConn.setLocalDescription(offer);
      }, function (error) {
        alert("Error when creating an offer");
      });


    }).catch(function (e) {
      console.log('error : ' + e);
    });
  }

  audioCalling() {

  }


  // incomming or outgoing call popups

  openIncommingCallPopup(){
    this.isIncomming = true;
  //  this.incomingCallModel.modal();
  }

  openOutgoingCallPopup(){
    this.isOutgoing = true;
  //  this.outgoingCallModel.modal();
  }








  configuration = {
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302'
    }]
  };


  //when somebody sends us an offer 
  handleOffer(offer) {
    this.yourConn.setRemoteDescription(new RTCSessionDescription(offer.data));

    //create an answer to an offer 
    this.yourConn.createAnswer(function (answer) {
      this.yourConn.setLocalDescription(answer);

      this.socket.emit('rtc-manager', {
        type: 'answer',
        caller: offer.caller,
        calle: offer.calle,
        data: answer
      });

    }, function (error) {
      alert("Error when creating an answer");
    });
  };

  //when we got an answer from a remote user
  handleAnswer(answer) {
    this.yourConn.setRemoteDescription(new RTCSessionDescription(answer.data));
  };

  //when we got an ice candidate from a remote user 
  handleCandidate(candidate) {
    this.yourConn.addIceCandidate(new RTCIceCandidate(candidate.data));
  };

  //hang up 
  hangUp() {

    this.socket.emit('rtc-manager', {
      type: 'leave',
      caller: this.username,
      calle: this.callename,
      data: ''
    });

    this.handleLeave();
  };

  handleLeave() {
    this.remoteVideo.src = null;

    this.yourConn.close();
    this.yourConn.onicecandidate = null;
    this.yourConn.onaddstream = null;
  };



}
