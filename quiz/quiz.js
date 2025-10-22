

(function(){
  // ====== Elements & State ======
  const form = document.getElementById('quiz-form');
  const steps = Array.from(document.querySelectorAll('.quiz-step'));
  const stepOrder = ['1','2','3','4','result'];
  let current = 0; // index in stepOrder

  // ====== Helpers ======
  function showStep(idx){
    current = Math.max(0, Math.min(idx, stepOrder.length-1));
    const targetStep = stepOrder[current];
    steps.forEach(s => {
      const isTarget = s.getAttribute('data-step') === targetStep;
      s.hidden = !isTarget;
    });
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function getCheckedValue(name){
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  }

  function requireInStep(stepIdx){
    // Map step -> required radio group
    const map = { 0:'figureFor', 1:'occasion', 2:'style', 3:'budget' };
    const group = map[stepIdx];
    if(!group) return true;
    return !!getCheckedValue(group);
  }

  function toHuman(map, key, fallback){
    return (map[key] || fallback || key || '').trim();
  }

  function buildData(){
    return {
      figureFor: getCheckedValue('figureFor'),
      occasion:  getCheckedValue('occasion'),
      style:     getCheckedValue('style'),
      budget:    getCheckedValue('budget')
    };
  }

  const HUMAN = {
    figureFor: {
      gift:'Gift for a friend',
      homeDecor:'Home decor',
      collection:'Collection',
      child:'For a child'
    },
    occasion: {
      birthday:'Birthday',
      newYear:'New Year',
      specialMoment:'Special moment',
      justForFun:'Just for fun'
    },
    style: {
      minimalism:'Minimalism / monochrome',
      popArt:'Bright / pop art',
      streetStyle:'Street-style',
      futurism:'Futurism / hi-tech'
    },
    budget: {
      under100:'under €100',
      '100to300':'€100–300',
      over300:'€300+'
    }
  };

  function buildResultSentence(d){
    const who = toHuman(HUMAN.figureFor, d.figureFor, d.figureFor);
    const occ = toHuman(HUMAN.occasion, d.occasion, d.occasion);
    const sty = toHuman(HUMAN.style, d.style, d.style);
    const bud = toHuman(HUMAN.budget, d.budget, d.budget);
    const parts = [];
    if(sty) parts.push(sty);
    if(who) parts.push(`for ${who.toLowerCase()}`);
    if(occ) parts.push(`(${occ.toLowerCase()})`);
    const base = parts.filter(Boolean).join(' ');
    return `${base}${bud?`. Budget: ${bud}.`:''}`.replace(/\s+/g,' ').trim();
  }

  function buildEnglishMessage(d){
    return [
      'Request from evgdamk.com quiz',
      `For: ${toHuman(HUMAN.figureFor, d.figureFor, '-')}`,
      `Occasion: ${toHuman(HUMAN.occasion, d.occasion, '-')}`,
      `Style: ${toHuman(HUMAN.style, d.style, '-')}`,
      `Budget: ${toHuman(HUMAN.budget, d.budget, '-')}`,
      '',
      "I'd like to discuss a custom art figure."
    ].join('\n');
  }

  async function copyToClipboard(text){
    try{ await navigator.clipboard.writeText(text); alert('Message copied. Open Instagram and paste it into DM.'); }
    catch(e){
      const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); alert('Message copied. Open Instagram and paste it into DM.'); }
      catch(err){ alert('Copy failed. Please copy manually:\n\n'+text); }
      finally{ document.body.removeChild(ta); }
    }
  }

  function updateResult(){
    const data = buildData();
    // Fill readable sentence
    const resEl = document.getElementById('result-message');
    resEl.textContent = `You might like a ${buildResultSentence(data)}`;

    // Wire actions
    const englishMsg = buildEnglishMessage(data);

    // Auto-copy the message when clicking the Instagram button, then open profile
    const instaBtn = document.getElementById('write-instagram-btn');
    if(instaBtn){
      instaBtn.onclick = async (e) => {
        e.preventDefault();
        await copyToClipboard(englishMsg);
        window.open(instaBtn.href, '_blank');
      };
    }

    // Optionally set Instagram username link here if dynamic is needed
    // const insta = document.getElementById('write-instagram-btn');
    // insta.href = 'https://instagram.com/evg.damk'; // already in HTML; keep if you want to set via JS

    // Save shareable answers in URL
    const params = new URLSearchParams({
      figureFor: data.figureFor,
      occasion:  data.occasion,
      style:     data.style,
      budget:    data.budget
    });
    history.replaceState(null, '', `?${params.toString()}`);
  }

  // ====== Event Wiring ======
  form.addEventListener('click', (e)=>{
    if(e.target.classList.contains('next-btn')){
      if(requireInStep(current)){
        if(current === 3){ // going to result
          updateResult();
          showStep(4);
        }else{
          showStep(current+1);
        }
      }else{
        alert('Please choose an option.');
      }
    }
    if(e.target.classList.contains('prev-btn')){
      showStep(current-1);
    }
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(requireInStep(3)){
      updateResult();
      showStep(4);
    }
  });

  // Restore from URL if present
  const sp = new URLSearchParams(location.search);
  if(sp.size){
    ['figureFor','occasion','style','budget'].forEach(k=>{
      const v = sp.get(k);
      if(!v) return;
      const el = form.querySelector(`input[name="${k}"][value="${v}"]`);
      if(el) el.checked = true;
    });
    updateResult();
    showStep(4);
  }else{
    showStep(0);
  }
})();