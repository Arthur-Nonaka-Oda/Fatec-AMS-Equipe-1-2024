var timemarker = 0;
var framey = 0;
// Add time markers
for (var i = 0; i<=25; i++) {
  var minutes = Math.floor(i / 60);
  var seconds = i % 60;
  document.getElementById("timemarker").innerHTML += '<p class="marker noselect">'+("0"+minutes).slice(-2)+':'+("0"+seconds).slice(-2)+'</p>';
}
// Add layers
for (var i = 0; i<=4; i++) {  document.getElementById("layers").innerHTML += '<div class="layercont"><div class="grab" onmousedown="grabClick(this)"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.40818 6.57731C2.16355 6.23131 2.16355 5.76869 2.40818 5.42269L5.18318 1.49788C5.58164 0.934331 6.41767 0.934295 6.81617 1.49781L9.59169 5.42261C9.83639 5.76865 9.83639 6.23135 9.59169 6.57739L6.81617 10.5022C6.41767 11.0657 5.58164 11.0657 5.18318 10.5021L2.40818 6.57731Z" fill="white"/></svg></div><input type="hidden" class="layernum" value="'+i+'"><input type="hidden" class="layertime" value="0"></div>';
}
var holding = false;
var holdingtime = false;
var el = 0;
function grabClick(element) {
  holding = true;
  el = element.parentElement.getElementsByClassName('layernum')[0].value;
  element.classList.add("activegrab");
  element.classList.add("gohigh");
  var timey = Math.floor((element.parentElement.offsetLeft+element.parentElement.offsetWidth-49));
  var frametime = Math.floor(timey*.6)%60;
  var seconds = Math.floor((timey*.6)/60)%60;
  var minutes = Math.floor(((timey*.6)/60)/60);
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;
  frametime = (frametime < 10) ? "0" + frametime : frametime;
  element.innerHTML += '<div id="grabcursor" class="noselect">'+minutes+':'+seconds+':'+frametime+'</div>';
  document.getElementById("grabcursor").classList.add("showcursor");
  for (var opacityt = 0; opacityt < 1.1; opacityt += 0.05) {           
    setTimeout(function(){document.getElementById('grabcursor').style.opacity = opacityt;},100)               }  
}
function grabTime() {
  holdingtime = true;
}
function grabDone() {
  if (holding) {
    var element = document.querySelectorAll('.layernum[value="'+el+'"]')[0];
  element.parentElement.getElementsByClassName('grab')[0].classList.remove("activegrab");
    element.parentElement.getElementsByClassName('grab')[0].classList.remove("gohigh");
      for (var opacityt = 1; opacityt > 0; opacityt -= 0.05) {           
    setTimeout(function(){document.getElementById('grabcursor').style.opacity = opacityt;},200)               }  
    var parent = element.parentElement.getElementsByClassName('grab')[0].innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.40818 6.57731C2.16355 6.23131 2.16355 5.76869 2.40818 5.42269L5.18318 1.49788C5.58164 0.934331 6.41767 0.934295 6.81617 1.49781L9.59169 5.42261C9.83639 5.76865 9.83639 6.23135 9.59169 6.57739L6.81617 10.5022C6.41767 11.0657 5.58164 11.0657 5.18318 10.5021L2.40818 6.57731Z" fill="white"/></svg>';
  holding = false;
  }
  holdingtime = false;
}
function grabMove(event) {
      var x = event.clientX+document.getElementById("timeline").scrollLeft;
    var element = document.querySelectorAll('.layernum[value="'+el+'"]')[0];
  if (holding && element.parentElement.offsetWidth >= 32 && el != 0) {
    var timey = Math.floor((element.parentElement.offsetLeft+element.parentElement.offsetWidth-49));
    var frametime = Math.floor(timey*.6)%60;
    var seconds = Math.floor((timey*.6)/60)%60;
    var minutes = Math.floor(((timey*.6)/60)/60);
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    frametime = (frametime < 10) ? "0" + frametime : frametime;
    document.getElementById("grabcursor").innerHTML = minutes+":"+seconds+":"+frametime;
  element.parentElement.style.width = x-element.parentElement.offsetLeft+"px";
    if (element.parentElement.offsetWidth > 32) {
      element.parentElement.getElementsByClassName('grab')[0].style.marginLeft = (x-10-element.parentElement.offsetLeft)+"px";
    } else if (x >= element.parentElement.getElementsByClassName('grab').offsetLeft) {
      element.parentElement.getElementsByClassName('grab')[0].style.marginLeft = (x-10-element.parentElement.offsetLeft)+"px";
    } else {
      element.parentElement.getElementsByClassName('grab')[0].style.marginLeft = "22px";
    }
  } else if (holding && element.parentElement.offsetWidth >=50 && el == 0) {
    var timey = Math.floor((element.parentElement.offsetLeft+element.parentElement.offsetWidth-49));
    var frametime = Math.floor(timey*.6)%60;
    var seconds = Math.floor((timey*.6)/60)%60;
    var minutes = Math.floor(((timey*.6)/60)/60);
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    frametime = (frametime < 10) ? "0" + frametime : frametime;
    document.getElementById("grabcursor").innerHTML = minutes+":"+seconds+":"+frametime;
      element.parentElement.style.width = x-element.parentElement.offsetLeft+"px";
    if (element.parentElement.offsetWidth > 50) {
      element.parentElement.getElementsByClassName('grab')[0].style.marginLeft = (x-10-element.parentElement.offsetLeft)+"px";
    } else if (x >= element.parentElement.getElementsByClassName('grab').offsetLeft) {
      element.parentElement.getElementsByClassName('grab')[0].style.marginLeft = (x-10-element.parentElement.offsetLeft)+"px";
    } else {
      element.parentElement.getElementsByClassName('grab')[0].style.marginLeft = "41px";
    }
  }
  if (holdingtime) {
    var timey = Math.floor((document.getElementById("timecursor").offsetLeft-18));
    framey = timey;
    var frametime = Math.floor(timey*.6)%60;
    var seconds = Math.floor((timey*.6)/60)%60;
    var minutes = Math.floor(((timey*.6)/60)/60);
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
   frametime = (frametime < 10) ? "0" + frametime : frametime;
    document.getElementById("timecursor").innerHTML = minutes+":"+seconds+":"+frametime;
     if (document.getElementById("timecursor").offsetLeft > 18) {
       document.getElementById("timecursor").style.marginLeft = x-(document.getElementById("timecursor").offsetWidth/2)+"px";
     } else if (x > (document.getElementById("timecursor").offsetLeft+(document.getElementById("timecursor").offsetWidth/2))) {
       document.getElementById("timecursor").style.marginLeft = x-(document.getElementById("timecursor").offsetWidth/2)+"px";
     } else {
       document.getElementById("timecursor").style.marginLeft = "18px";
     }
    if (event.clientX >= document.getElementById("timeline").offsetWidth-35) {
      document.getElementById("timeline").scrollTo(document.getElementById("timeline").scrollLeft+20,0);
    }
    if (event.clientX <= 35) {
      document.getElementById("timeline").scrollTo(document.getElementById("timeline").scrollLeft-20,0);
    }
  }
}
playing = false;
function playTrigger() { 
  if (!playing) {
    playing = true;
    iterate();
  } else {
    playing = false;
  }
}
function iterate() {
   document.getElementById("timecursor").style.marginLeft = framey+20+"px";
   framey++;
  var timey = Math.floor((document.getElementById("timecursor").offsetLeft-18));
    var frametime = Math.floor(timey*.6)%60;
    var seconds = Math.floor((timey*.6)/60)%60;
    var minutes = Math.floor(((timey*.6)/60)/60);
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
   frametime = (frametime < 10) ? "0" + frametime : frametime;
    document.getElementById("timecursor").innerHTML = minutes+":"+seconds+":"+frametime;
  if (document.getElementById("timecursor").offsetLeft <= 500 && playing) {
    setTimeout(iterate,16.66);
  }
}