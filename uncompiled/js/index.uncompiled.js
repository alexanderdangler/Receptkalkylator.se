var { DateTime, Interval } = require("luxon"); //imports Luxon
// to browswerify: 
// browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js

var currentFunction = "usage";
var aktuelltRecept;

// Function that manipulate the form and turns off/"disables" the input boxes not used
function setUpInitialForm(currentFunctionState, buttonSelector) {
  $("#alertReceptInfo, .hideAtFormSetUp").addClass("d-none");
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
    updateCreamCounter();
  } else {
    $("#mainForm").removeClass("d-none");
    $("#creamForm").addClass("d-none");
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
          aktuelltRecept = `Receptet utfärdat idag med dosen ${dosage} kommer räcka till ${DateTime.fromISO(dateTo).plus({ days: extraDays }).toISODate()} baserat på <b>${withdrawlsCalculated} stycken uttag</b> á ${packageSize} tabletter. Totalt antal tabletter för hela perioden blir ${Math.ceil(days * totalPillsPerDay)} stycken.`;
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
            aktuelltRecept = `Patientens recept från ${dateFrom} för dosen ${dosage} av ${packageSize} tabletter med ${withdrawls} uttag <b>bör räcka i ytterligare ${remainingDays} dagar till och med den ${toDate.toISODate()}</b>. Vid dagens datum ${today.toISODate()} bör det fortfarande finnas kvar ${Math.floor(packageSize * withdrawls - Interval.fromDateTimes(fromDate, today).length('days') * totalPillsPerDay)} tabletter. Om alla tabletter förbrukats till idag har det skett med en snittförbrukning på ${Math.round(((packageSize * withdrawls / Interval.fromDateTimes(fromDate, today).length('days')) + Number.EPSILON) * 10) / 10} tabletter/dag.`;
          } else {
            aktuelltRecept = `Patientens recept från ${dateFrom} för ${packageSize} tabletter i ${withdrawls} uttag med dosen ${dosage} bör ha tagit slut ` + toDate.toISODate() + ". Således har patienten varit utan tabletter i " + Math.floor(Interval.fromDateTimes(toDate, today).length('days')) + " dagar.";
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
      var days = Math.ceil((packageSize * withdrawls) / totalPillsPerDay);
      if (typeof dateFrom === 'string') {
        var toDate = DateTime.fromISO(dateTo);
        var fromDate = DateTime.fromISO(dateFrom);
        var today = DateTime.now();
        var days = Math.ceil(toDate.diff(fromDate).as('days'));
        aktuelltRecept = `Om receptet skrivet ${dateFrom} med ${withdrawls} uttag av ${packageSize} tabletter helt har förbrukats till den ${dateTo} har det skett med en <b>snittförbrukning på ${Math.round(((packageSize * withdrawls / days) + Number.EPSILON) * 10) / 10} tabletter/dag</b>. Totalt antal tabletter förskrivet är ${packageSize * withdrawls} stycken`;
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
    let totalPillsPerDay;
    let dos = dosage.replace(/\*|X/g, "x").replace(",", ".");

    if (dos.search(/\+/) > 0) {
      function evaluateDos(fn) { // This function is to circumvent security risk with Math.eval()
        return new Function('return ' + fn)();
      }
      totalPillsPerDay = evaluateDos(dos);
    } else {
      let antal = /([0-9.]+)/.exec(dos);
      let tillfallen = /([0-9]+)/.exec(/x([0-9]+)/.exec(dos));
      if (tillfallen !== null) {
        totalPillsPerDay = antal[0] * tillfallen[0];
      } else {
        totalPillsPerDay = antal[0];
      }
    }

    return totalPillsPerDay;
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

function updateCreamCounter() {
  var totalGrams = 0;
  switch ($('input[name="patient_age"]:checked').val()) {
    case "vuxen":
      $(".count").each(function () {
        switch ($(this).attr("id")) {
          case "face":
            totalGrams += $(this).val() * 1.25;
            break;
          case "chest":
            totalGrams += $(this).val() * 3.5;
            break;
          case "back":
            totalGrams += $(this).val() * 3.5;
            break;
          case "arm":
            totalGrams += $(this).val() * 1.5;
            break;
          case "hand":
            totalGrams += $(this).val() * 0.5;
            break;
          case "leg":
            totalGrams += $(this).val() * 3;
            break;
          case "foot":
            totalGrams += $(this).val() * 1;
        }
      });
      break;
    case "6-10":
      $(".count").each(function () {
        switch ($(this).attr("id")) {
          case "face":
            totalGrams += $(this).val() * 1;
            break;
          case "chest":
            totalGrams += $(this).val() * 1.75;
            break;
          case "back":
            totalGrams += $(this).val() * 2.5;
            break;
          case "arm":
            totalGrams += $(this).val() * 0.9375;
            break;
          case "hand":
            totalGrams += $(this).val() * 0.3125;
            break;
          case "leg":
            totalGrams += $(this).val() * 1.6875;
            break;
          case "foot":
            totalGrams += $(this).val() * 0.5625;
        }
      });
      break;
    case "3-6":
      $(".count").each(function () {
        switch ($(this).attr("id")) {
          case "face":
            totalGrams += $(this).val() * 0.75;
            break;
          case "chest":
            totalGrams += $(this).val() * 1.5;
            break;
          case "back":
            totalGrams += $(this).val() * 1.75;
            break;
          case "arm":
            totalGrams += $(this).val() * 0.75;
            break;
          case "hand":
            totalGrams += $(this).val() * 0.25;
            break;
          case "leg":
            totalGrams += $(this).val() * 1.125;
            break;
          case "foot":
            totalGrams += $(this).val() * 0.375;
        }
      });
      break;
    case "1-3":
      $(".count").each(function () {
        switch ($(this).attr("id")) {
          case "face":
            totalGrams += $(this).val() * 0.75;
            break;
          case "chest":
            totalGrams += $(this).val() * 1;
            break;
          case "back":
            totalGrams += $(this).val() * 1.5;
            break;
          case "arm":
            totalGrams += $(this).val() * 0.5625;
            break;
          case "hand":
            totalGrams += $(this).val() * 0.1875;
            break;
          case "leg":
            totalGrams += $(this).val() * 0.75;
            break;
          case "foot":
            totalGrams += $(this).val() * 0.25;
        }
      });
      break;
    case "0-1":
      $(".count").each(function () {
        switch ($(this).attr("id")) {
          case "face":
            totalGrams += $(this).val() * 0.5;
            break;
          case "chest":
            totalGrams += $(this).val() * 0.5;
            break;
          case "back":
            totalGrams += $(this).val() * 0.75;
            break;
          case "arm":
            totalGrams += $(this).val() * 0.375;
            break;
          case "hand":
            totalGrams += $(this).val() * 0.125;
            break;
          case "leg":
            totalGrams += $(this).val() * 0.5625;
            break;
          case "foot":
            totalGrams += $(this).val() * 0.1875;
        }
      });
      break;
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

function addCreamDoses() {
  var elements = `<div class="row g-2 mb-2 creamDosesBlock">
  <div class="col-auto">
    <div class="form-floating">
      <select class="form-select timesPerWeek" id="timesPerWeek">
      <option value="21">Morgon, lunch och kväll</option>
      <option value="14">Morgon & kväll</option>
      <option value="7" selected>Dagligen</option>
      <option value="3.5">Varannan dag</option>
      <option value="2">2 gånger per vecka</option>
      <option value="1">1 gång per vecka</option>
      </select>
      <label for="timesPerWeek">Gånger per dag</label>
    </div>
  </div>
  <div class="col-auto">
    <div class="form-floating">
      <input id="weeks" type="number" class="form-control weeks" placeholder="i antal veckor">
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
  <div class="col-auto align-items-center d-flex">
    <button class="btn btn-danger removeButton" type="button"><i class="bi bi-dash-circle-dotted"></i> Ta bort</button>
  </div>
</div>`
  $('#creamDoses').append(elements);
}

function updatePremadeSchedule() {
  $('#creamDoses').empty();
  var elements = `<div class="row g-2 mb-2 creamDosesBlock">
  <div class="col-auto">
    <div class="form-floating">
      <select class="form-select timesPerWeek" id="timesPerWeek">
      <option value="21">Morgon, lunch och kväll</option>
      <option value="14" selected>Morgon & kväll</option>
      <option value="7">Dagligen</option>
      <option value="3.5">Varannan dag</option>
      <option value="2">2 gånger per vecka</option>
      <option value="1">1 gång per vecka</option>
      </select>
      <label for="timesPerWeek">Gånger per dag</label>
    </div>
  </div>
  <div class="col-auto">
    <div class="form-floating">
      <input id="weeks" type="number" class="form-control weeks" placeholder="i antal veckor" value="1">
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
</div>
<div class="row g-2 mb-2 creamDosesBlock">
  <div class="col-auto">
    <div class="form-floating">
      <select class="form-select timesPerWeek" id="timesPerWeek">
      <option value="21">Morgon, lunch och kväll</option>
      <option value="14">Morgon & kväll</option>
      <option value="7" selected>Dagligen</option>
      <option value="3.5">Varannan dag</option>
      <option value="2">2 gånger per vecka</option>
      <option value="1">1 gång per vecka</option>
      </select>
      <label for="timesPerWeek">Gånger per dag</label>
    </div>
  </div>
  <div class="col-auto">
    <div class="form-floating">
      <input id="weeks" type="number" class="form-control weeks" placeholder="i antal veckor" value="1">
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
  <div class="col-auto align-items-center d-flex">
    <button class="btn btn-danger removeButton" type="button"><i class="bi bi-dash-circle-dotted"></i> Ta bort</button>
  </div>
</div>
<div class="row g-2 mb-2 creamDosesBlock">
  <div class="col-auto">
    <div class="form-floating">
      <select class="form-select timesPerWeek" id="timesPerWeek">
      <option value="21">Morgon, lunch och kväll</option>
      <option value="14">Morgon & kväll</option>
      <option value="7">Dagligen</option>
      <option value="3.5" selected>Varannan dag</option>
      <option value="2">2 gånger per vecka</option>
      <option value="1">1 gång per vecka</option>
      </select>
      <label for="timesPerWeek">Gånger per dag</label>
    </div>
  </div>
  <div class="col-auto">
    <div class="form-floating">
      <input id="weeks" type="number" class="form-control weeks" placeholder="i antal veckor" value="1">
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
  <div class="col-auto align-items-center d-flex">
    <button class="btn btn-danger removeButton" type="button"><i class="bi bi-dash-circle-dotted"></i> Ta bort</button>
  </div>
</div>
<div class="row g-2 mb-2 creamDosesBlock">
  <div class="col-auto">
    <div class="form-floating">
      <select class="form-select timesPerWeek" id="timesPerWeek">
      <option value="21">Morgon, lunch och kväll</option>
      <option value="14">Morgon & kväll</option>
      <option value="7">Dagligen</option>
      <option value="3.5">Varannan dag</option>
      <option value="2" selected>2 gånger per vecka</option>
      <option value="1">1 gång per vecka</option>
      </select>
      <label for="timesPerWeek">Gånger per dag</label>
    </div>
  </div>
  <div class="col-auto">
    <div class="form-floating">
      <input id="weeks" type="number" class="form-control weeks" placeholder="i antal veckor" value="1">
      <label for="weeks">i antal veckor</label>
    </div>
  </div>
  <div class="col-auto align-items-center d-flex">
    <button class="btn btn-danger removeButton" type="button"><i class="bi bi-dash-circle-dotted"></i> Ta bort</button>
  </div>
</div>`
  $('#creamDoses').append(elements);
  updateCreamCounter()
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
    updateCreamCounter();
  });
  $(".minus").on('click', function () {
    if ($(this).next('.count').val() > 0) {
      $(this).next('.count').val(parseInt($(this).next('.count').val()) - 1);
      updateCreamCounter();
    }
  });

});