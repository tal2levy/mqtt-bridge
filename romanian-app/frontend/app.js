const i18n = {
  he: {title: 'לימוד רומנית', home: 'המשך למידה'},
  en: {title: 'Learn Romanian', home: 'Continue learning'},
  ru: {title: 'Изучаем румынский', home: 'Продолжить'}
};

let lang = 'he';
function setLang(l){
  lang = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  document.getElementById('title').innerText = i18n[l].title;
}

setLang('he');
document.getElementById('lang').onchange = e=>setLang(e.target.value);

async function loadScreen(screen){
  const content = document.getElementById('content');
  if(screen === 'home'){
    content.innerHTML = `<h2>${i18n[lang].home}</h2>`;
    const nw = await fetch('/api/whatsnew');
    const data = await nw.json();
    content.innerHTML += `<p>מעודכן עד: ${data.updatedTo}</p>`;
    content.innerHTML += '<ul>' + data.files.map(f=>`<li>${f.name}</li>`).join('') + '</ul>';
  } else if(screen === 'chat'){
    content.innerHTML = '<input id="msg" placeholder="הודעה"/><button id="send">שלח</button><div id="chat"></div>';
    document.getElementById('send').onclick = async ()=>{
      const message = document.getElementById('msg').value;
      const res = await fetch('/api/chat',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message, lang})});
      const data = await res.json();
      document.getElementById('chat').innerHTML += `<p><b>מורה:</b> ${data.reply} (${data.translation})</p>`;
    };
  } else {
    content.innerHTML = `<p>${screen}</p>`;
  }
}

Array.from(document.querySelectorAll('nav button')).forEach(btn=>{
  btn.onclick = ()=>loadScreen(btn.dataset.screen);
});

loadScreen('home');

// register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('pwa/service-worker.js');
}
