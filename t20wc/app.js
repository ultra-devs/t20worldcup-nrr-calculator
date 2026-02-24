// T20 NRR calculator logic
const teams = [
  { name: 'India', flag: 'https://flagcdn.com/w40/in.png' },
  { name: 'Pakistan', flag: 'https://flagcdn.com/w40/pk.png' },
  { name: 'Australia', flag: 'https://flagcdn.com/w40/au.png' },
  { name: 'England', flag: 'https://flagcdn.com/w40/gb.png' },
  { name: 'New Zealand', flag: 'https://flagcdn.com/w40/nz.png' },
  { name: 'South Africa', flag: 'https://flagcdn.com/w40/za.png' },
  { name: 'Sri Lanka', flag: 'https://flagcdn.com/w40/lk.png' },
  { name: 'Bangladesh', flag: 'https://flagcdn.com/w40/bd.png' },
  { name: 'Afghanistan', flag: 'https://flagcdn.com/w40/af.png' },
  { name: 'West Indies', flag: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Flag_of_the_West_Indies_Cricket_Board.png' },
  { name: 'Zimbabwe', flag: 'https://flagcdn.com/w40/zw.png' },
  { name: 'Ireland', flag: 'https://flagcdn.com/w40/ie.png' },
  { name: 'Netherlands', flag: 'https://flagcdn.com/w40/nl.png' },
  { name: 'Scotland', flag: 'https://flagcdn.com/w40/gb-sct.png' },
  { name: 'USA', flag: 'https://flagcdn.com/w40/us.png' },
  { name: 'Nepal', flag: 'https://flagcdn.com/w40/np.png' },
  { name: 'Oman', flag: 'https://flagcdn.com/w40/om.png' },
  { name: 'UAE', flag: 'https://flagcdn.com/w40/ae.png' },
  { name: 'Namibia', flag: 'https://flagcdn.com/w40/na.png' },
  { name: 'Papua New Guinea', flag: 'https://flagcdn.com/w40/pg.png' }
];

function $(id){ return document.getElementById(id); }

function populateTeams(){
  const cand = $('candidate-team');
  const opp = $('opponent-team');
  teams.forEach(t=>{
    const o1 = document.createElement('option'); o1.value=t.name; o1.textContent=t.name; cand.appendChild(o1);
    const o2 = document.createElement('option'); o2.value=t.name; o2.textContent=t.name; opp.appendChild(o2);
  });
  opp.selectedIndex = 1;

  // set initial flags
  const candFlag = $('candidate-flag');
  const oppFlag = $('opponent-flag');
  if(candFlag) candFlag.src = teams[0].flag;
  if(oppFlag) oppFlag.src = teams[1].flag;

  cand.addEventListener('change', ()=>{
    const sel = teams.find(t=> t.name === cand.value);
    if(sel && candFlag) candFlag.src = sel.flag;
    // update current NRR label to include team name
    const label = document.getElementById('current-nrr-label');
    if(label) label.textContent = `${cand.value} current NRR (before match)`;
  });
  opp.addEventListener('change', ()=>{
    const sel = teams.find(t=> t.name === opp.value);
    if(sel && oppFlag) oppFlag.src = sel.flag;
  });
}

function oversToFloat(overs, balls, allOut){
  // overs: integer overs, balls: 0-5 as integer
  let o = Number(overs) + (Number(balls) || 0)/6;
  if(allOut){
    // T20 all-out=full-overs rule
    return 20.0;
  }
  return o;
}

function formatNum(n){ return Number(n).toFixed(3); }
function formatSigned(n){
  const num = Number(n);
  if (Number.isNaN(num)) return '0.000';
  if (num > 0) return `+${num.toFixed(3)}`;
  if (num < 0) return `${num.toFixed(3)}`; // negative already has '-'
  return '0.000';
}

function calculateMatchNRR(){
  const candRuns = Number($('cand-runs').value) || 0;
  const candOvers = Number($('cand-overs').value) || 0;
  const candBalls = Number($('cand-balls').value) || 0;
  const candWkts = Number($('cand-wkts').value) || 0;

  const oppRuns = Number($('opp-runs').value) || 0;
  const oppOvers = Number($('opp-overs').value) || 0;
  const oppBalls = Number($('opp-balls').value) || 0;
  const oppWkts = Number($('opp-wkts').value) || 0;

  const candAllOut = candWkts >= 10;
  const oppAllOut = oppWkts >= 10;

  const candOversFloat = oversToFloat(candOvers, candBalls, candAllOut);
  const oppOversFloat = oversToFloat(oppOvers, oppBalls, oppAllOut);

  const runRateFor = candOversFloat > 0 ? candRuns / candOversFloat : 0;
  const runRateAgainst = oppOversFloat > 0 ? oppRuns / oppOversFloat : 0;
  const matchNRR = runRateFor - runRateAgainst;

  return {
    matchNRR, runRateFor, runRateAgainst,
    candRuns, candOversFloat, oppRuns, oppOversFloat
  };
}

function toOversAndBallsFloat(overs, balls){
  return Number(overs) + (Number(balls)||0)/6;
}

function calculateTournamentNRR(match){
  // If user provided current tournament NRR directly, use it to compute approximate after-match NRR.
  const currentNrrInput = $('current-nrr') && $('current-nrr').value !== '' ? Number($('current-nrr').value) : null;
  if(currentNrrInput !== null){
    // We cannot precisely compute after-match NRR from only current NRR without totals.
    // But provide an approximation by adding match NRR to the current NRR (useful quick estimate).
    const approxAfter = currentNrrInput + (match && typeof match.matchNRR === 'number' ? match.matchNRR : 0);
    return { beforeNRR: currentNrrInput, afterNRR: approxAfter, approximate: true };
  }
  return null;
}

function showResults(){
  const r = calculateMatchNRR();
  const matchNrrEl = $('match-nrr');
  const newTournEl = $('new-tournament-nrr');
  const deltaEl = $('delta-nrr');
  const winnerEl = $('winner');

  matchNrrEl.textContent = `Match NRR (candidate): ${formatSigned(r.matchNRR)}  —  (${formatNum(r.runRateFor)} - ${formatNum(r.runRateAgainst)})`;
  // color the match NRR text green for positive, red for negative
  matchNrrEl.classList.remove('text-green-700','text-red-600');
  if(r.matchNRR > 0){ matchNrrEl.classList.add('text-green-700'); } else if(r.matchNRR < 0){ matchNrrEl.classList.add('text-red-600'); }

  // determine winner based on runs
  let winnerText = '';
  if(r.candRuns > r.oppRuns) winnerText = `${$('candidate-team').value} won`; else if(r.candRuns < r.oppRuns) winnerText = `${$('opponent-team').value} won`; else winnerText = 'Match tied';

  const tourn = calculateTournamentNRR(r);
  if(tourn){
    if(tourn.afterNRR === null || tourn.afterNRR === undefined){
      newTournEl.innerHTML = `<span class="text-gray-700">Tournament NRR BEFORE:</span> <span class="font-semibold">${formatNum(tourn.beforeNRR)}</span> <span class="text-gray-500">AFTER: N/A</span>`;
      deltaEl.innerHTML = `<span class="text-gray-500">Delta:</span> <span class="font-semibold">N/A</span>`;
    } else {
      if(tourn.approximate){
        // Use signed display for before/after and highlight the estimate
        const afterSign = tourn.afterNRR > 0 ? 'text-green-800 bg-green-100' : (tourn.afterNRR < 0 ? 'text-red-600 bg-red-100' : 'text-gray-800 bg-gray-100');
        newTournEl.innerHTML = `<span class="text-gray-700">Tournament NRR BEFORE:</span> <span class="font-semibold">${formatSigned(tourn.beforeNRR)}</span> <span class="text-gray-500">AFTER (estimate):</span> <span class="ml-2 px-2 py-1 rounded ${afterSign}">${formatSigned(tourn.afterNRR)}</span>`;
        const deltaEstimate = tourn.afterNRR - tourn.beforeNRR;
        deltaEl.innerHTML = `<span class="text-gray-500">Delta (estimate):</span> <span class="font-semibold">${formatSigned(deltaEstimate)}</span>`;
      } else {
        const deltaVal = tourn.afterNRR - tourn.beforeNRR;
        const afterSign = tourn.afterNRR > 0 ? 'text-green-800 bg-green-100' : (tourn.afterNRR < 0 ? 'text-red-600 bg-red-100' : 'text-gray-800 bg-gray-100');
        newTournEl.innerHTML = `<span class="text-gray-700">Tournament NRR BEFORE:</span> <span class="font-semibold">${formatSigned(tourn.beforeNRR)}</span> <span class="text-gray-500">AFTER:</span> <span class="ml-2 px-2 py-1 rounded ${afterSign}">${formatSigned(tourn.afterNRR)}</span>`;
        deltaEl.innerHTML = `<span class="text-gray-500">Delta:</span> <span class="font-semibold">${formatSigned(deltaVal)}</span>`;
      }
    }
  } else {
    newTournEl.textContent = '';
    deltaEl.textContent = '';
  }

  // show winner
  if(winnerEl){
    winnerEl.textContent = winnerText;
    const winnerFlagEl = $('winner-flag');
    const trophyEl = $('winner-trophy');
    if(winnerText.includes('won')){
      winnerEl.classList.add('text-green-700');
      winnerEl.classList.remove('text-gray-700');
      if(trophyEl) trophyEl.classList.remove('hidden');
      // set flag for winner
      const winnerName = winnerText.replace(' won','');
      const winnerTeam = teams.find(t=> t.name === winnerName);
      if(winnerTeam && winnerFlagEl){ winnerFlagEl.src = winnerTeam.flag; winnerFlagEl.classList.remove('hidden'); }
    } else {
      winnerEl.classList.remove('text-green-700');
      if(winnerFlagEl) winnerFlagEl.classList.add('hidden');
      if(trophyEl) trophyEl.classList.add('hidden');
    }
  }

   $('results').classList.remove('hidden');
}

function resetForm(){
  $('nrr-form').reset();
  $('results').classList.add('hidden');
  // clear current NRR input if present
  if($('current-nrr')) $('current-nrr').value = '';
  // reset batted-first toggle to default (yes)
  const hidden = document.getElementById('batted-first');
  const btnYes = document.getElementById('batted-yes');
  const btnNo = document.getElementById('batted-no');
  if(hidden) hidden.value = 'yes';
  if(btnYes && btnNo){
    btnYes.classList.add('bg-indigo-600','text-white'); btnYes.classList.remove('bg-white','text-gray-700','border');
    btnNo.classList.remove('bg-indigo-600','text-white'); btnNo.classList.add('bg-white','text-gray-700','border');
  }
}

function init(){
  populateTeams();
  $('calc').addEventListener('click', ()=>{ showResults(); });
  $('reset').addEventListener('click', ()=>{ resetForm(); });

  // Update fieldset legends when user selects whether candidate batted first
  function updateInningsLabels(){
    const val = document.getElementById('batted-first')?.value || 'yes';
    const legends = document.querySelectorAll('#nrr-form fieldset legend');
    if(legends.length >= 2){
      if(val === 'yes'){
        legends[0].textContent = 'Candidate innings (1st innings)';
        legends[1].textContent = 'Opponent innings (2nd innings)';
      } else {
        legends[0].textContent = 'Candidate innings (2nd innings)';
        legends[1].textContent = 'Opponent innings (1st innings)';
      }
    }
  }

  // Toggle button logic for batted-first
  const btnYes = document.getElementById('batted-yes');
  const btnNo = document.getElementById('batted-no');
  const hidden = document.getElementById('batted-first');
  function setBatted(val){
    hidden.value = val;
    if(val === 'yes'){
      btnYes.classList.add('bg-indigo-600','text-white'); btnYes.classList.remove('bg-white','text-gray-700','border');
      btnNo.classList.remove('bg-indigo-600','text-white'); btnNo.classList.add('bg-white','text-gray-700','border');
    } else {
      btnNo.classList.add('bg-indigo-600','text-white'); btnNo.classList.remove('bg-white','text-gray-700','border');
      btnYes.classList.remove('bg-indigo-600','text-white'); btnYes.classList.add('bg-white','text-gray-700','border');
    }
    updateInningsLabels();
  }
  btnYes.addEventListener('click', ()=> setBatted('yes'));
  btnNo.addEventListener('click', ()=> setBatted('no'));

  updateInningsLabels();
}

init();

// Fetch visitor count from user-provided POST API and update UI; show 'N/A' on failure
(function(){
  const visitorEl = document.getElementById('visitor-count');
  const badgeEl = document.getElementById('viewer-count');
  if(!visitorEl && !badgeEl) return;

  const url = 'https://trackbacks-suffering-min-catch.trycloudflare.com/counter';

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    mode: 'cors'
  })
  .then(res => {
    if(!res.ok) throw new Error(`Counter API returned ${res.status}`);
    return res.json();
  })
  .then(data => {
    if(data && typeof data.count === 'number'){
      const v = data.count;
      if(visitorEl) visitorEl.textContent = v;
      if(badgeEl) badgeEl.textContent = v;
    } else {
      if(visitorEl) visitorEl.textContent = 'N/A';
      if(badgeEl) badgeEl.textContent = 'N/A';
    }
  })
  .catch(err => {
    console.warn('Counter API failed:', err);
    if(visitorEl) visitorEl.textContent = 'N/A';
    if(badgeEl) badgeEl.textContent = 'N/A';
  });
})();
