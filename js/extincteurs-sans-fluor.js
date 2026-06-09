document.addEventListener('DOMContentLoaded', function () {
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function animateNumber(el, target, duration) {
    if (!el) return;
    var start = 0;
    var startTs = null;

    function tick(ts) {
      if (!startTs) startTs = ts;
      var progress = Math.min((ts - startTs) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(start + (target - start) * eased);
      el.textContent = value.toLocaleString('fr-FR');
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  var daysTo2030El = document.getElementById('daysTo2030');
  if (daysTo2030El) {
    var targetDate = new Date('2030-01-01T00:00:00');
    var today = new Date();
    var days = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / MS_PER_DAY));
    animateNumber(daysTo2030El, days, 1400);
  }

  // Parallax hero supprimé — scroll propre

  var timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length) {
    var timelineObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.35 });

    timelineItems.forEach(function (item) {
      timelineObserver.observe(item);
    });
  }

  var scenarioData = {
    '10': { replace: 'Investissement direct, rapide', convert: 'Économie potentielle ciblée', idle: 'Risque modéré aujourd\'hui, fort demain' },
    '50': { replace: 'Planification en lots recommandée', convert: 'Levier budget + déchets', idle: 'Risque de pic de coûts' },
    '200': { replace: 'Programme pluriannuel conseillé', convert: 'Approche industrielle pertinente', idle: 'Risque critique (coûts + charge)' }
  };

  var scenarioButtons = document.querySelectorAll('.scenario-btn');
  var strategyReplace = document.querySelector('[data-key="replace"]');
  var strategyConvert = document.querySelector('[data-key="convert"]');
  var strategyIdle = document.querySelector('[data-key="idle"]');

  function applyScenario(volume) {
    var payload = scenarioData[volume];
    if (!payload) return;
    if (strategyReplace) strategyReplace.textContent = payload.replace;
    if (strategyConvert) strategyConvert.textContent = payload.convert;
    if (strategyIdle) strategyIdle.textContent = payload.idle;
  }

  scenarioButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      scenarioButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyScenario(btn.dataset.volume);
    });
  });

  applyScenario('10');

  var radarSeries = {
    legacy: [86, 22, 28, 34, 74],
    new: [82, 88, 90, 78, 79],
    converted: [78, 76, 84, 86, 83]
  };

  var radarMessages = {
    legacy: 'Performance extinction élevée, mais projection réglementaire et environnementale limitée.',
    new: 'Équilibre performance, conformité long terme et réduction d\'impact environnemental.',
    converted: 'Compromis solide : optimisation du parc existant selon éligibilité technique.'
  };

  var radarChart = document.getElementById('radarChart');
  var radarLegend = document.getElementById('radarLegend');
  var radarButtons = document.querySelectorAll('.radar-btn');

  function svgEl(name, attrs) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function polarToCartesian(cx, cy, radius, angleDeg) {
    var radians = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians)
    };
  }

  function buildRadarPolygon(values, cx, cy, radius) {
    var angles = [0, 72, 144, 216, 288];
    return values.map(function (value, idx) {
      var point = polarToCartesian(cx, cy, radius * (value / 100), angles[idx]);
      return point.x.toFixed(2) + ',' + point.y.toFixed(2);
    }).join(' ');
  }

  function drawRadar(seriesKey) {
    if (!radarChart) return;

    var values = radarSeries[seriesKey];
    var labels = ['Performance', 'Impact env.', 'Conformité LT', 'Coût global', 'Maintenance'];
    var cx = 200;
    var cy = 200;
    var radius = 135;

    radarChart.innerHTML = '';

    for (var ring = 1; ring <= 5; ring++) {
      var r = (radius / 5) * ring;
      var points = buildRadarPolygon([100, 100, 100, 100, 100], cx, cy, r);
      radarChart.appendChild(svgEl('polygon', {
        points: points,
        fill: 'none',
        stroke: '#dbe3ea',
        'stroke-width': '1'
      }));
    }

    var axes = [0, 72, 144, 216, 288];
    axes.forEach(function (angle, idx) {
      var end = polarToCartesian(cx, cy, radius, angle);
      radarChart.appendChild(svgEl('line', {
        x1: cx,
        y1: cy,
        x2: end.x,
        y2: end.y,
        stroke: '#cfd8e1',
        'stroke-width': '1'
      }));

      var labelPos = polarToCartesian(cx, cy, radius + 28, angle);
      var label = svgEl('text', {
        x: labelPos.x,
        y: labelPos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#5f666b',
        'font-size': '11',
        'font-weight': '700'
      });
      label.textContent = labels[idx];
      radarChart.appendChild(label);
    });

    var dataPoints = buildRadarPolygon(values, cx, cy, radius);
    radarChart.appendChild(svgEl('polygon', {
      points: dataPoints,
      fill: 'rgba(229, 51, 43, 0.22)',
      stroke: '#E5332B',
      'stroke-width': '2'
    }));

    if (radarLegend && radarMessages[seriesKey]) {
      radarLegend.textContent = radarMessages[seriesKey];
    }
  }

  radarButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      radarButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      drawRadar(btn.dataset.series);
    });
  });

  drawRadar('legacy');

  // Market grid — highlight cyclique automatique
  var marketItems = document.querySelectorAll('.market-item');
  if (marketItems.length) {
    var currentMarket = 0;

    function cycleMarket() {
      marketItems.forEach(function (el) { el.classList.remove('market-active'); });
      marketItems[currentMarket].classList.add('market-active');
      currentMarket = (currentMarket + 1) % marketItems.length;
    }

    // Démarrer uniquement quand la section est visible
    var marketGrid = document.getElementById('marketGrid');
    if (marketGrid) {
      var marketStarted = false;
      var marketCycleInterval = null;

      var marketObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !marketStarted) {
            marketStarted = true;
            cycleMarket();
            marketCycleInterval = setInterval(cycleMarket, 2000);
          } else if (!entry.isIntersecting && marketCycleInterval) {
            clearInterval(marketCycleInterval);
            marketStarted = false;
            marketItems.forEach(function (el) { el.classList.remove('market-active'); });
          }
        });
      }, { threshold: 0.3 });

      marketObserver.observe(marketGrid);
    }
  }

  // barObserver supprimé — les barres ont été remplacées par icônes + badges

  var steps = document.querySelectorAll('.step-card');
  if (steps.length) {
    var stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          steps.forEach(function (s) { s.classList.remove('active'); });
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.55 });

    steps.forEach(function (step) {
      stepObserver.observe(step);
    });
  }

  var decisionQuestion = document.getElementById('decisionQuestion');
  var decisionResult = document.getElementById('decisionResult');
  var decisionCta = document.getElementById('decisionCta');
  var decisionButtons = document.querySelectorAll('.decision-btn');

  var decisionTree = {
    start: {
      q: 'Avez-vous des extincteurs à eau avec additif ?',
      yes: 'fluor',
      no: { result: 'Priorité faible à moyenne : vérifiez vos références et maintenez un suivi périodique.' }
    },
    fluor: {
      q: 'Vos extincteurs sont-ils fluorés ?',
      yes: 'state',
      no: { result: 'Conserver temporairement avec suivi documentaire et contrôle de conformité.' }
    },
    state: {
      q: 'Sont-ils encore en bon état opérationnel ?',
      yes: 'eligible',
      no: { result: 'Remplacement progressif recommandé pour sécuriser la conformité future.' }
    },
    eligible: {
      q: 'Sont-ils techniquement éligibles à une transformation ?',
      yes: { result: 'Transformation à étudier : option pertinente pour limiter déchets et coûts.' },
      no: { result: 'Remplacement ciblé conseillé, avec planification budgétaire par phases.' }
    }
  };

  var currentDecisionNode = 'start';

  function renderDecisionNode(nodeKey) {
    var node = decisionTree[nodeKey];
    if (!node) return;
    currentDecisionNode = nodeKey;
    if (decisionQuestion) decisionQuestion.textContent = node.q || '';
    if (decisionResult) decisionResult.textContent = '';
    if (decisionCta) decisionCta.hidden = true;
    decisionButtons.forEach(function (btn) { btn.hidden = false; });
  }

  function resolveDecision(answer) {
    var node = decisionTree[currentDecisionNode];
    if (!node) return;
    var next = node[answer];
    if (!next) return;

    if (typeof next === 'string') {
      renderDecisionNode(next);
      return;
    }

    if (next.result) {
      if (decisionResult) {
        decisionResult.textContent = next.result;
      }
      if (decisionCta) {
        decisionCta.hidden = false;
      }
      decisionButtons.forEach(function (btn) { btn.hidden = true; });

      var restartBtn = document.getElementById('decisionRestart');
      if (!restartBtn) {
        restartBtn = document.createElement('button');
        restartBtn.id = 'decisionRestart';
        restartBtn.className = 'decision-btn';
        restartBtn.textContent = 'Recommencer';
        restartBtn.style.marginLeft = '10px';
        var container = document.querySelector('.decision-actions');
        if (container) {
          container.appendChild(restartBtn);
          restartBtn.addEventListener('click', function () {
            renderDecisionNode('start');
            restartBtn.remove();
          });
        }
      }
    }
  }

  decisionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      resolveDecision(btn.dataset.answer);
    });
  });

  renderDecisionNode('start');

  var simShare = document.getElementById('simShare');
  var simShareValue = document.getElementById('simShareValue');
  if (simShare && simShareValue) {
    var updateShare = function () {
      simShareValue.textContent = simShare.value + '%';
    };
    simShare.addEventListener('input', updateShare);
    updateShare();
  }

  var simulatorForm = document.getElementById('simulatorForm');
  var priorityLevel = document.getElementById('priorityLevel');
  var priorityText = document.getElementById('priorityText');

  if (simulatorForm && priorityLevel && priorityText) {
    simulatorForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var count = parseInt(document.getElementById('simExt').value || '0', 10);
      var site = document.getElementById('simSite').value;
      var age = document.getElementById('simAge').value;
      var share = parseInt(document.getElementById('simShare').value || '0', 10);
      var need = document.getElementById('simNeed').value;

      var score = 0;
      if (count >= 100) score += 35;
      else if (count >= 40) score += 24;
      else score += 12;

      if (share >= 60) score += 30;
      else if (share >= 30) score += 18;
      else score += 8;

      if (age === 'old') score += 20;
      if (age === 'mid') score += 12;

      if (site === 'erp' || site === 'industrie') score += 14;
      else if (site === 'collectivite') score += 10;
      else score += 6;

      if (need === 'audit') score += 8;
      if (need === 'replace') score += 10;
      if (need === 'convert') score += 6;

      if (score >= 72) {
        priorityLevel.textContent = 'Élevé';
        priorityLevel.style.color = '#E5332B';
        priorityText.textContent = 'Transition à prioriser maintenant : audit terrain et plan d\'action recommandé à court terme.';
      } else if (score >= 45) {
        priorityLevel.textContent = 'Moyen';
        priorityLevel.style.color = '#D77A00';
        priorityText.textContent = 'Préparez une feuille de route progressive pour sécuriser votre trajectoire réglementaire.';
      } else {
        priorityLevel.textContent = 'Faible';
        priorityLevel.style.color = '#2DA26E';
        priorityText.textContent = 'Parc à surveiller : planifiez un contrôle périodique et validez vos références.';
      }
    });
  }

  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;

    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      faqItems.forEach(function (other) {
        other.classList.remove('open');
        var oa = other.querySelector('.faq-a');
        if (oa) oa.style.maxHeight = '0px';
      });

      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  var diagnosticForm = document.getElementById('diagnosticForm');
  if (diagnosticForm) {
    diagnosticForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = diagnosticForm.querySelector('button[type="submit"]');
      if (!submitBtn) return;
      var previousText = submitBtn.textContent;
      submitBtn.textContent = 'Demande envoyée — PSL vous recontacte';
      submitBtn.style.background = '#2DA26E';
      submitBtn.style.borderColor = '#2DA26E';
      submitBtn.disabled = true;

      setTimeout(function () {
        diagnosticForm.reset();
        submitBtn.textContent = previousText;
        submitBtn.style.background = '';
        submitBtn.style.borderColor = '';
        submitBtn.disabled = false;
      }, 3500);
    });
  }
});
