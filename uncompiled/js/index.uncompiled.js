var { DateTime, Interval } = require("luxon"); //imports Luxon
// to browswerify: 
// browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js

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
  $("#alertReceptInfo, .hideAtFormSetUp, #kortisonTabell").addClass("d-none");
  $(".btnSelector").addClass("btn-outline-primary").removeClass("btn-primary");
  $(buttonSelector).removeClass("btn-outline-primary").addClass("btn-primary");
  $(".formGroupSelectorElement").removeClass("d-none");
  currentFunction = currentFunctionState;
  if (currentFunction === "usage") {
    changeDate("+", "0", "days", "#toDate");
  }

  if (currentFunction === "cream") {
    $("#mainForm").addClass("d-none");
    $("#creamForm").removeClass("d-none");
    $("#kortisonTabell").removeClass("d-none");
    $("#FAQsalvorokramer").prependTo("#FAQ");
    updateCreamCounter();
  } else {
    $("#mainForm").removeClass("d-none");
    $("#creamForm").addClass("d-none");
    $("#FAQsalvorokramer").appendTo("#FAQ");
    mainFunction();
  }
}

// The function that calculates all the necessary data
function mainFunction() {
  const dateFrom = $("#fromDate").val();
  const dateTo = $("#toDate").val();
  const dosage = $("#dosage").val();
  const packageSize = $("#packageSize").val();
  const withdrawls = $("#withdrawls").val();
  $("#additionalInfo").html("");

  if (currentFunction === "uttag") {
    $("#headerToDate").html("Hur länge ska receptet räcka?");
    $(".uttagDropdown").removeClass("d-none");
    $(".usageDropdown").addClass("d-none");
    $("#formGroupWithdrawls, #formGroupFromDate").addClass("d-none");
    if (typeof dateTo === 'string') {
      var days = calculateDateDifference();
      if (typeof dosage === 'string') {
        var totalPillsPerDay = calculateTotalPillsPerDay();
        if (packageSize > 0 && totalPillsPerDay > 0 && days > 0) {
          var withdrawlsCalculated = Math.ceil((days * totalPillsPerDay) / packageSize);
          var pillsLeftAtEndofPrescription = (packageSize * withdrawlsCalculated) - (days * totalPillsPerDay);
          var extraDays = pillsLeftAtEndofPrescription / totalPillsPerDay;
          aktuelltRecept = `Receptet utfärdat idag med dosen ${escapeHtml(dosage)} kommer räcka till ${DateTime.fromISO(dateTo).plus({ days: extraDays }).toISODate()} baserat på <b>${withdrawlsCalculated} stycken uttag</b> á ${escapeHtml(packageSize)} tabletter. Totalt antal tabletter för hela perioden blir ${Math.ceil(days * totalPillsPerDay)} stycken.`;
          updateReceptText()
          $("#additionalInfo").html("<hr><i><ul><li>Detta recept räcker " + Math.floor(extraDays) + " dagar längre det datum du önskade</li><li>Om patienten förskrivs 1 paket vid varje uttag kan den tidigast hämta ut ett nytt uttag efter " + Math.floor((packageSize / totalPillsPerDay) / 3 * 2) + " dagar, och 1 uttag räcker som max i " + Math.floor(packageSize / totalPillsPerDay) + " dagar. <a id='toAccordion5' href='#flush-heading5'>Läs mer nedan</a>.</li></ul></i>").removeClass("d-none");
        }
      }
    }
  }

  if (currentFunction === "dagar") {
    $("#formGroupToDate").addClass("d-none");
    if (typeof dosage === 'string') {
      var totalPillsPerDay = calculateTotalPillsPerDay();
      if (packageSize > 0 && withdrawls > 0 && totalPillsPerDay > 0) {
        var days = Math.ceil((packageSize * withdrawls) / totalPillsPerDay);
        if (typeof dateFrom === 'string') {
          var toDate = DateTime.fromISO(dateFrom).plus({ days: days });
          var fromDate = DateTime.fromISO(dateFrom);
          var today = DateTime.now();
          if (toDate > today) {
            var remainingDays = Math.ceil(toDate.diff(today).as('days'));
            aktuelltRecept = `Patientens recept från ${escapeHtml(dateFrom)} för dosen ${escapeHtml(dosage)} av ${escapeHtml(packageSize)} tabletter med ${escapeHtml(withdrawls)} uttag <b>bör räcka i ytterligare ${remainingDays} dagar till och med den ${toDate.toISODate()}</b>. Vid dagens datum ${today.toISODate()} bör det fortfarande finnas kvar ${Math.floor(packageSize * withdrawls - Interval.fromDateTimes(fromDate, today).length('days') * totalPillsPerDay)} tabletter. Om alla tabletter förbrukats till idag har det skett med en snittförbrukning på ${Math.round(((packageSize * withdrawls / Interval.fromDateTimes(fromDate, today).length('days')) + Number.EPSILON) * 10) / 10} tabletter/dag.`;
          } else {
            aktuelltRecept = `Patientens recept från ${escapeHtml(dateFrom)} för ${escapeHtml(packageSize)} tabletter i ${escapeHtml(withdrawls)} uttag med dosen ${escapeHtml(dosage)} bör ha tagit slut ` + toDate.toISODate() + ". Således har patienten varit utan tabletter i " + Math.floor(Interval.fromDateTimes(toDate, today).length('days')) + " dagar.";
            $("#additionalInfo").html(`<hr><i>Snittförbrukning: ${Math.round(((packageSize * withdrawls / Interval.fromDateTimes(fromDate, toDate).length('days')) + Number.EPSILON) * 10) / 10} tabletter/dag.</i>`).removeClass("d-none");
          }
          updateReceptText()
        }
      }
    }
  }

  if (currentFunction === "usage") {
    $(".uttagDropdown").addClass("d-none");
    $(".usageDropdown").removeClass("d-none");
    $("#formGroupDose").addClass("d-none");
    $("#headerToDate").html("När tog receptet slut?");
    if (packageSize > 0 && withdrawls > 0) {
      if (typeof dateFrom === 'string') {
        var toDate = DateTime.fromISO(dateTo);
        var fromDate = DateTime.fromISO(dateFrom);
        var today = DateTime.now();
        var days = Math.ceil(toDate.diff(fromDate).as('days'));
        aktuelltRecept = `Om receptet skrivet ${escapeHtml(dateFrom)} med ${escapeHtml(withdrawls)} uttag av ${escapeHtml(packageSize)} tabletter helt har förbrukats till den ${escapeHtml(dateTo)} har det skett med en <b>snittförbrukning på ${Math.round(((packageSize * withdrawls / days) + Number.EPSILON) * 10) / 10} tabletter/dag</b>. Totalt antal tabletter förskrivet är ${packageSize * withdrawls} stycken`;
        updateReceptText();
      }
    }
  }

  function calculateDateDifference() {
    var now = DateTime.now();
    var later = DateTime.fromISO(dateTo);
    var i = Interval.fromDateTimes(now, later);
    var days = Math.round(i.length('days'));
    return days;
  }

  function updateReceptText() {
    $("#alertReceptInfo").removeClass("d-none");
    $("#pReceptText").html(aktuelltRecept);
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
  if (addOrSub === "+") {
    var date = DateTime.now().plus({ [timeFrame]: numberOf }).toISODate();
  } else if (addOrSub === "-") {
    var date = DateTime.now().minus({ [timeFrame]: numberOf }).toISODate();
  }
  $(element).val(date);
}

function copyAktuelltReceptToClipboard() {
  var strippedAktuelltRecept = $("<div/>").html(aktuelltRecept).text();
  navigator.clipboard.writeText(strippedAktuelltRecept).then(
    () => {
      $('#kopieraKnapp').html("<i class='bi bi-clipboard-check-fill'></i> Kopierat");
    },
    () => {
      $('#kopieraKnapp').html("Tyvärr stödjer inte din webbläsare kopiering :'(");
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
  var ageGroup = $('input[name="patient_age"]:checked').val();
  var gramsTable = creamGramsPerUnit[ageGroup];
  var totalGrams = 0;

  if (gramsTable) {
    $(".count").each(function () {
      var bodyPart = $(this).attr("id");
      if (gramsTable[bodyPart]) {
        totalGrams += $(this).val() * gramsTable[bodyPart];
      }
    });
  }

  var totalApplications = 0;
  var doseringsText = "";

  $(".creamDosesBlock").each(function () {
    var weeks = $(this).find(".weeks").val();
    var timesPerWeek = $(this).find(".timesPerWeek").val()
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
    $("#alertReceptInfo").removeClass("d-none");
    $("#pReceptText").html(aktuelltRecept);
  } else if (totalGramsAll == 0) {
    $("#alertReceptInfo").addClass("d-none");
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
      <input id="weeks" type="number" class="form-control weeks" placeholder="i antal veckor"${weeksValue ? ' value="' + weeksValue + '"' : ""}>
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
  ${removeBtn}
</div>`;
}

function addCreamDoses() {
  $('#creamDoses').append(createCreamDoseBlock("7", "", true));
}

function updatePremadeSchedule() {
  $('#creamDoses').empty();
  $('#creamDoses').append(
    createCreamDoseBlock("7", "2", false) +
    createCreamDoseBlock("3.5", "2", true) +
    createCreamDoseBlock("2", "2", true)
  );
  updateCreamCounter();
}


// Functions to run when the document has loaded completely and to be listened for all the time
$(function () {
  setUpInitialForm("usage", "#btnUsage");
  $('#btnDagar').on('click', function () { setUpInitialForm("dagar", "#btnDagar") });
  $('#btnUttag').on('click', function () { setUpInitialForm("uttag", "#btnUttag") });
  $('#btnUsage').on('click', function () { setUpInitialForm("usage", "#btnUsage") });
  $('#btnCream').on('click', function () { setUpInitialForm("cream", "#btnCream") });

  $("#fromDate, #toDate, #dosage, #packageSize, #withdrawls").on("input", mainFunction);

  $('.dateDropdown').on('click', function () {
    var element = $(this);
    changeDate(element.data("addorsub"), element.data("numberof"), element.data("timeframe"), element.data("element"));
    mainFunction();
  });

  $(document).on('click', 'a[href^="#"]', function (event) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      event.preventDefault();
      $('html, body').stop().animate({
        scrollTop: target.offset().top
      }, 600);
    }
    $("#flush-heading5 button").trigger("click");
  });

  $('#kopieraKnapp').on('click', copyAktuelltReceptToClipboard);

  // Funktion för plus och minusknappar
  $('.count').prop('disabled', true);
  $('input[name="patient_age"], .weeks, .timesPerWeek').on('input', function () { updateCreamCounter() });
  $('#premadeSchedule').on('click', function () { updatePremadeSchedule() });
  $('#creamDoses').on('click', '.timesPerWeek', function () { updateCreamCounter() });
  $('#creamDoses').on('input', '.weeks', function () { updateCreamCounter() });
  // Knapp för att ta bort doseringen och uppdaterar sen uträkningen
  $('#creamDoses').on('click', '.removeButton', function () { 
    $(this).closest(".creamDosesBlock").remove();
    updateCreamCounter();
  });
  $("#moreCreamDoses").on('click', function () { addCreamDoses() });
  $(".plus").on('click', function () {
    $(this).prev('.count').val(parseInt($(this).prev('.count').val()) + 1);
    $(this).prevAll('.showNumber').html($(this).prev('.count').val());
    updateCreamCounter();
  });
  $(".minus").on('click', function () {
    if ($(this).nextAll('.count').val() > 0) {
      $(this).nextAll('.count').val(parseInt($(this).nextAll('.count').val()) - 1);
      $(this).next('.showNumber').html($(this).nextAll('.count').val());
      updateCreamCounter();
    }
  });

  // Keyboard accessibility for plus/minus buttons
  $(".plus, .minus").on('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $(this).trigger('click');
    }
  });

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

});