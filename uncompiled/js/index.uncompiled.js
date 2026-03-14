// Native date helpers (replacing Luxon)
function parseISO(str) {
  var parts = str.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function toISODate(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

function todayISO() { return toISODate(new Date()); }

function addDays(date, n) {
  var d = new Date(date.getTime());
  d.setDate(d.getDate() + Math.floor(n));
  var frac = n % 1;
  if (frac) d.setTime(d.getTime() + frac * 86400000);
  return d;
}

function diffDays(a, b) {
  return (b.getTime() - a.getTime()) / 86400000;
}

// DOM helpers
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

var currentFunction = "usage";
var aktuelltRecept;

// Escape HTML to prevent injection when inserting user values into template strings
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// Function that manipulate the form and turns off/"disables" the input boxes not used
function setUpInitialForm(currentFunctionState, buttonSelector) {
  qsa('#alertReceptInfo, .hideAtFormSetUp, #kortisonTabell').forEach(function(el) { el.classList.add('d-none'); });
  qsa('.btnSelector').forEach(function(el) { el.classList.remove('tab-active'); el.setAttribute('aria-selected', 'false'); });
  var btn = qs(buttonSelector);
  btn.classList.add('tab-active');
  btn.setAttribute('aria-selected', 'true');
  qsa('.formGroupSelectorElement').forEach(function(el) { el.classList.remove('d-none'); });
  currentFunction = currentFunctionState;
  if (currentFunction === "usage") {
    changeDate("+", "0", "days", "#toDate");
  }

  if (currentFunction === "cream") {
    qs('#mainForm').classList.add('d-none');
    qs('#creamForm').classList.remove('d-none');
    qs('#kortisonTabell').classList.remove('d-none');
    qs('#FAQ').prepend(qs('#FAQsalvorokramer'));
    updateCreamCounter();
  } else {
    qs('#mainForm').classList.remove('d-none');
    qs('#creamForm').classList.add('d-none');
    qs('#FAQ').append(qs('#FAQsalvorokramer'));
    mainFunction();
  }
}

// The function that calculates all the necessary data
function mainFunction() {
  const dateFrom = qs('#fromDate').value;
  const dateTo = qs('#toDate').value;
  const dosage = qs('#dosage').value;
  const packageSize = qs('#packageSize').value;
  const withdrawls = qs('#withdrawls').value;
  qs('#additionalInfo').innerHTML = '';

  if (currentFunction === "uttag") {
    qs('#headerToDate').innerHTML = "Hur länge ska receptet räcka?";
    qsa('.uttagDropdown').forEach(function(el) { el.classList.remove('d-none'); });
    qsa('.usageDropdown').forEach(function(el) { el.classList.add('d-none'); });
    qsa('#formGroupWithdrawls, #formGroupFromDate').forEach(function(el) { el.classList.add('d-none'); });
    if (typeof dateTo === 'string') {
      var days = calculateDateDifference();
      if (typeof dosage === 'string') {
        var totalPillsPerDay = calculateTotalPillsPerDay();
        if (packageSize > 0 && totalPillsPerDay > 0 && days > 0) {
          var withdrawlsCalculated = Math.ceil((days * totalPillsPerDay) / packageSize);
          var pillsLeftAtEndofPrescription = (packageSize * withdrawlsCalculated) - (days * totalPillsPerDay);
          var extraDays = pillsLeftAtEndofPrescription / totalPillsPerDay;
          aktuelltRecept = `Receptet utfärdat idag med dosen ${escapeHtml(dosage)} kommer räcka till ${toISODate(addDays(parseISO(dateTo), extraDays))} baserat på <b>${withdrawlsCalculated} stycken uttag</b> á ${escapeHtml(packageSize)} tabletter. Totalt antal tabletter för hela perioden blir ${Math.ceil(days * totalPillsPerDay)} stycken.`;
          updateReceptText();
          var addInfo = qs('#additionalInfo');
          addInfo.innerHTML = "<hr><i><ul><li>Detta recept räcker " + Math.floor(extraDays) + " dagar längre det datum du önskade</li><li>Om patienten förskrivs 1 paket vid varje uttag kan den tidigast hämta ut ett nytt uttag efter " + Math.floor((packageSize / totalPillsPerDay) / 3 * 2) + " dagar, och 1 uttag räcker som max i " + Math.floor(packageSize / totalPillsPerDay) + " dagar. <a id='toAccordion5' href='#flush-heading5'>Läs mer nedan</a>.</li></ul></i>";
          addInfo.classList.remove('d-none');
        }
      }
    }
  }

  if (currentFunction === "dagar") {
    qs('#formGroupToDate').classList.add('d-none');
    if (typeof dosage === 'string') {
      var totalPillsPerDay = calculateTotalPillsPerDay();
      if (packageSize > 0 && withdrawls > 0 && totalPillsPerDay > 0) {
        var days = Math.ceil((packageSize * withdrawls) / totalPillsPerDay);
        if (typeof dateFrom === 'string') {
          var toDate = addDays(parseISO(dateFrom), days);
          var fromDate = parseISO(dateFrom);
          var today = new Date();
          if (toDate > today) {
            var remainingDays = Math.ceil(diffDays(today, toDate));
            aktuelltRecept = `Patientens recept från ${escapeHtml(dateFrom)} för dosen ${escapeHtml(dosage)} av ${escapeHtml(packageSize)} tabletter med ${escapeHtml(withdrawls)} uttag <b>bör räcka i ytterligare ${remainingDays} dagar till och med den ${toISODate(toDate)}</b>. Vid dagens datum ${todayISO()} bör det fortfarande finnas kvar ${Math.floor(packageSize * withdrawls - diffDays(fromDate, today) * totalPillsPerDay)} tabletter. Om alla tabletter förbrukats till idag har det skett med en snittförbrukning på ${Math.round(((packageSize * withdrawls / diffDays(fromDate, today)) + Number.EPSILON) * 10) / 10} tabletter/dag.`;
          } else {
            aktuelltRecept = `Patientens recept från ${escapeHtml(dateFrom)} för ${escapeHtml(packageSize)} tabletter i ${escapeHtml(withdrawls)} uttag med dosen ${escapeHtml(dosage)} bör ha tagit slut ` + toISODate(toDate) + ". Således har patienten varit utan tabletter i " + Math.floor(diffDays(toDate, today)) + " dagar.";
            var addInfo = qs('#additionalInfo');
            addInfo.innerHTML = `<hr><i>Snittförbrukning: ${Math.round(((packageSize * withdrawls / diffDays(fromDate, toDate)) + Number.EPSILON) * 10) / 10} tabletter/dag.</i>`;
            addInfo.classList.remove('d-none');
          }
          updateReceptText();
        }
      }
    }
  }

  if (currentFunction === "usage") {
    qsa('.uttagDropdown').forEach(function(el) { el.classList.add('d-none'); });
    qsa('.usageDropdown').forEach(function(el) { el.classList.remove('d-none'); });
    qs('#formGroupDose').classList.add('d-none');
    qs('#headerToDate').innerHTML = "När tog receptet slut?";
    if (packageSize > 0 && withdrawls > 0) {
      if (typeof dateFrom === 'string') {
        var toDate = parseISO(dateTo);
        var fromDate = parseISO(dateFrom);
        var days = Math.ceil(diffDays(fromDate, toDate));
        aktuelltRecept = `Om receptet skrivet ${escapeHtml(dateFrom)} med ${escapeHtml(withdrawls)} uttag av ${escapeHtml(packageSize)} tabletter helt har förbrukats till ${escapeHtml(dateTo)} har det skett med en <b>snittförbrukning på ${Math.round(((packageSize * withdrawls / days) + Number.EPSILON) * 10) / 10} tabletter/dag</b>. Totalt antal tabletter förskrivet var ${packageSize * withdrawls} stycken`;
        updateReceptText();
      }
    }
  }

  function calculateDateDifference() {
    return Math.round(diffDays(new Date(), parseISO(dateTo)));
  }

  function updateReceptText() {
    qs('#alertReceptInfo').classList.remove('d-none');
    qs('#pReceptText').innerHTML = aktuelltRecept;
  }

  function calculateTotalPillsPerDay() {
    let dos = dosage.replace(/\*|X/g, "x").replace(",", ".");

    // Only allow digits, dots, plus signs, and 'x' — reject anything else
    if (!/^[0-9.+x]+$/.test(dos)) {
      return NaN;
    }

    // Split on '+' and evaluate each part (supports formats: 1+0+1, 2x3, 1.5x2, 3)
    var parts = dos.split('+');
    var total = 0;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === '') continue;
      if (part.indexOf('x') > -1) {
        var factors = part.split('x');
        var product = 1;
        for (var j = 0; j < factors.length; j++) {
          product *= parseFloat(factors[j]);
        }
        total += product;
      } else {
        total += parseFloat(part);
      }
    }
    return total;
  }
}

function changeDate(addOrSub, numberOf, timeFrame, element) {
  var now = new Date();
  var n = Number(numberOf);
  if (addOrSub === "-") n = -n;
  var result = new Date(now.getTime());
  if (timeFrame === 'days') result = addDays(now, n);
  else if (timeFrame === 'months') result.setMonth(result.getMonth() + n);
  else if (timeFrame === 'years') result.setFullYear(result.getFullYear() + n);
  qs(element).value = toISODate(result);
}

function copyAktuelltReceptToClipboard() {
  var tmp = document.createElement('div');
  tmp.innerHTML = aktuelltRecept;
  navigator.clipboard.writeText(tmp.textContent).then(
    function() {
      qs('#kopieraKnapp').innerHTML = "<i class='bi bi-clipboard-check-fill'></i> Kopierat";
    },
    function() {
      qs('#kopieraKnapp').innerHTML = "Tyvärr stödjer inte din webbläsare kopiering :'(";
    }
  );
}

// Grams per application for each body part, by age group
var creamGramsPerUnit = {
  vuxen:  { face: 1.25, chest: 3.5,  back: 3.5,  arm: 1.5,    hand: 0.5,    leg: 3,      foot: 1      },
  "6-10": { face: 1,    chest: 1.75, back: 2.5,  arm: 0.9375, hand: 0.3125, leg: 1.6875, foot: 0.5625 },
  "3-6":  { face: 0.75, chest: 1.5,  back: 1.75, arm: 0.75,   hand: 0.25,   leg: 1.125,  foot: 0.375  },
  "1-3":  { face: 0.75, chest: 1,    back: 1.5,  arm: 0.5625, hand: 0.1875, leg: 0.75,   foot: 0.25   },
  "0-1":  { face: 0.5,  chest: 0.5,  back: 0.75, arm: 0.375,  hand: 0.125,  leg: 0.5625, foot: 0.1875 }
};

function updateCreamCounter() {
  var checked = qs('input[name="patient_age"]:checked');
  var ageGroup = checked ? checked.value : undefined;
  var gramsTable = creamGramsPerUnit[ageGroup];
  var totalGrams = 0;

  if (gramsTable) {
    qsa(".count").forEach(function (el) {
      var bodyPart = el.id;
      if (gramsTable[bodyPart]) {
        totalGrams += el.value * gramsTable[bodyPart];
      }
    });
  }

  var totalApplications = 0;
  var doseringsText = "";

  qsa(".creamDosesBlock").forEach(function (el) {
    var weeks = el.querySelector(".weeks").value;
    var timesPerWeek = el.querySelector(".timesPerWeek").value;
    var dosering;
    totalApplications += timesPerWeek * weeks;

    switch (timesPerWeek) {
      case "7":
        dosering = "1 gång per dag";
        break;
      case "14":
        dosering = "morgon & kväll";
        break;
      case "21":
        dosering = "morgon, lunch & kväll";
        break;
      case "3.5":
        dosering = "varannan dag";
        break;
      case "2":
        dosering = "2 gånger per vecka";
        break;
      case "1":
        dosering = "1 gång per vecka";
        break;
    }

    if(doseringsText == "") {
      doseringsText = `Smörj ${dosering} i ${weeks == 1 ? "1 vecka" : weeks + " veckor"}. `;
    } else {
      doseringsText += `Därefter ${dosering} i ${weeks == 1 ? "1 vecka" : weeks + " veckor"}. `;
    }

  });

  var totalGramsAll = totalGrams * totalApplications;
  if (totalGramsAll > 0) {
    aktuelltRecept = `${doseringsText}Använd mjukgörande dagligen. <b>Total åtgång ${Math.round(totalGramsAll)} gram.</b>`;
    qs("#alertReceptInfo").classList.remove("d-none");
    qs("#pReceptText").innerHTML = aktuelltRecept;
  } else if (totalGramsAll == 0) {
    qs("#alertReceptInfo").classList.add("d-none");
  }

}

function createCreamDoseBlock(selectedValue, weeksValue, showRemoveButton) {
  var options = [
    { value: "21", label: "Morgon, lunch och kväll" },
    { value: "14", label: "Morgon & kväll" },
    { value: "7", label: "Dagligen" },
    { value: "3.5", label: "Varannan dag" },
    { value: "2", label: "2 gånger per vecka" },
    { value: "1", label: "1 gång per vecka" }
  ];
  var optionsHtml = options.map(function (opt) {
    return `<option value="${opt.value}"${opt.value === selectedValue ? " selected" : ""}>${opt.label}</option>`;
  }).join("\n      ");

  var removeBtn = showRemoveButton
    ? `<div class="col-md-auto col-12 align-items-center d-flex">
    <button class="btn btn-danger removeButton" type="button"><i class="bi bi-dash-circle-dotted"></i> Ta bort</button>
  </div>` : "";

  return `<div class="row g-2 mb-2 creamDosesBlock">
  <div class="col-md-auto col-12">
    <div class="form-floating">
      <select class="form-select timesPerWeek" id="timesPerWeek">
      ${optionsHtml}
      </select>
      <label for="timesPerWeek">Gånger per dag</label>
    </div>
  </div>
  <div class="col-md-auto col-12">
    <div class="form-floating">
      <input id="weeks" type="number" class="form-control weeks" placeholder=" "${weeksValue ? ' value="' + weeksValue + '"' : ""}>
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
  ${removeBtn}
</div>`;
}

function addCreamDoses() {
  qs('#creamDoses').insertAdjacentHTML('beforeend', createCreamDoseBlock("7", "", true));
}

function updatePremadeSchedule() {
  qs('#creamDoses').innerHTML = '';
  qs('#creamDoses').insertAdjacentHTML('beforeend',
    createCreamDoseBlock("7", "2", false) +
    createCreamDoseBlock("3.5", "2", true) +
    createCreamDoseBlock("2", "2", true)
  );
  updateCreamCounter();
}


// Functions to run when the document has loaded completely and to be listened for all the time
document.addEventListener('DOMContentLoaded', function () {
  setUpInitialForm("usage", "#btnUsage");
  qs('#btnDagar').addEventListener('click', function () { setUpInitialForm("dagar", "#btnDagar") });
  qs('#btnUttag').addEventListener('click', function () { setUpInitialForm("uttag", "#btnUttag") });
  qs('#btnUsage').addEventListener('click', function () { setUpInitialForm("usage", "#btnUsage") });
  qs('#btnCream').addEventListener('click', function () { setUpInitialForm("cream", "#btnCream") });

  ['fromDate', 'toDate', 'dosage', 'packageSize', 'withdrawls'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', mainFunction);
  });

  qsa('.dateDropdown').forEach(function(el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      changeDate(this.dataset.addorsub, this.dataset.numberof, this.dataset.timeframe, this.dataset.element);
      mainFunction();
    });
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var target = qs(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
    var accordionBtn = qs('#flush-heading5 button');
    if (accordionBtn) accordionBtn.click();
  });

  qs('#kopieraKnapp').addEventListener('click', copyAktuelltReceptToClipboard);

  // Funktion för plus och minusknappar
  qsa('.count').forEach(function(el) { el.disabled = true; });
  qsa('input[name="patient_age"], .weeks, .timesPerWeek').forEach(function(el) {
    el.addEventListener('input', function () { updateCreamCounter() });
  });
  qs('#premadeSchedule').addEventListener('click', function () { updatePremadeSchedule() });
  var creamDoses = qs('#creamDoses');
  creamDoses.addEventListener('click', function (e) {
    if (e.target.closest('.timesPerWeek')) updateCreamCounter();
    var removeBtn = e.target.closest('.removeButton');
    if (removeBtn) {
      removeBtn.closest('.creamDosesBlock').remove();
      updateCreamCounter();
    }
  });
  creamDoses.addEventListener('input', function (e) {
    if (e.target.closest('.weeks')) updateCreamCounter();
  });
  // Knapp för att ta bort doseringen och uppdaterar sen uträkningen
  qs('#moreCreamDoses').addEventListener('click', function () { addCreamDoses() });
  qsa('.plus').forEach(function(el) {
    el.addEventListener('click', function () {
      var countInput = this.parentElement.querySelector('.count');
      var showNum = this.parentElement.querySelector('.showNumber');
      countInput.value = parseInt(countInput.value) + 1;
      showNum.innerHTML = countInput.value;
      updateCreamCounter();
    });
  });
  qsa('.minus').forEach(function(el) {
    el.addEventListener('click', function () {
      var countInput = this.parentElement.querySelector('.count');
      var showNum = this.parentElement.querySelector('.showNumber');
      if (parseInt(countInput.value) > 0) {
        countInput.value = parseInt(countInput.value) - 1;
        showNum.innerHTML = countInput.value;
        updateCreamCounter();
      }
    });
  });

  // Keyboard accessibility for plus/minus buttons
  qsa('.plus, .minus').forEach(function(el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  // Custom dropdown (replaces Bootstrap dropdown)
  var dropdownToggle = qs('[data-bs-toggle="dropdown"]');
  if (dropdownToggle) {
    var dropdownMenu = dropdownToggle.parentElement.querySelector('.dropdown-menu');
    dropdownToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = dropdownMenu.classList.contains('show');
      dropdownMenu.classList.toggle('show');
      dropdownToggle.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', function(e) {
      if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
    dropdownMenu.addEventListener('click', function(e) {
      if (e.target.classList.contains('dropdown-item')) {
        dropdownMenu.classList.remove('show');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdownMenu.classList.remove('show');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Custom accordion (replaces Bootstrap collapse)
  document.addEventListener('click', function(e) {
    var accBtn = e.target.closest('[data-bs-toggle="collapse"]');
    if (!accBtn) return;
    e.preventDefault();
    var targetSelector = accBtn.getAttribute('data-bs-target');
    var target = qs(targetSelector);
    if (!target) return;
    var parentSelector = target.getAttribute('data-bs-parent');
    var isOpen = target.classList.contains('show');

    // Close siblings within same parent accordion
    if (parentSelector) {
      qsa(parentSelector + ' .accordion-collapse.show').forEach(function(panel) {
        panel.classList.remove('show');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        panel.offsetHeight;
        panel.style.maxHeight = '0';
        var sibBtn = panel.previousElementSibling ? panel.previousElementSibling.querySelector('.accordion-button') : null;
        if (sibBtn) { sibBtn.classList.add('collapsed'); sibBtn.setAttribute('aria-expanded', 'false'); }
      });
    }

    if (!isOpen) {
      target.classList.add('show');
      target.style.maxHeight = target.scrollHeight + 'px';
      // After transition, switch to none so dynamic content isn't clipped
      setTimeout(function() { if (target.classList.contains('show')) target.style.maxHeight = 'none'; }, 350);
      accBtn.classList.remove('collapsed');
      accBtn.setAttribute('aria-expanded', 'true');
    } else {
      // Collapse: remove show first, set explicit height, reflow, then animate to 0
      target.classList.remove('show');
      target.style.maxHeight = target.scrollHeight + 'px';
      target.offsetHeight; // force reflow
      target.style.maxHeight = '0';
      accBtn.classList.add('collapsed');
      accBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // FAQ search
  var faqSearch = qs('#faq-search');
  if (faqSearch) {
    faqSearch.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();
      var items = qsa('#FAQ .accordion-item');
      var categories = qsa('#FAQ .faq-category');
      var anyVisible = false;

      items.forEach(function (item) {
        var question = item.querySelector('.accordion-button').textContent.toLowerCase();
        var answer = item.querySelector('.accordion-body').textContent.toLowerCase();
        var match = !query || question.indexOf(query) !== -1 || answer.indexOf(query) !== -1;
        item.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });

      // Hide category headings if all their items are hidden
      categories.forEach(function (heading) {
        var accordion = heading.nextElementSibling;
        if (accordion && accordion.classList.contains('accordion')) {
          var visibleItems = accordion.querySelectorAll('.accordion-item:not([style*="display: none"])');
          heading.style.display = visibleItems.length ? '' : 'none';
        }
      });

      var noResults = qs('#faq-no-results');
      if (noResults) {
        noResults.classList.toggle('d-none', anyVisible);
      }
    });
  }

});
