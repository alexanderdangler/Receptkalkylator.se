var { DateTime, Interval } = require("luxon"); //imports Luxon
// to browswerify: 
// browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js

var currentFunction = "dagar";
var aktuelltRecept;

// Function that manipulate the form and turns off/"disables" the input boxes not used
function setUpInitialForm(currentFunctionState, buttonSelector, stateId, dNone) {
    $("#alertReceptInfo, .hideAtFormSetUp").addClass("d-none");
    $(".btnSelector").addClass("btn-outline-primary").removeClass("btn-primary");
    $(buttonSelector).removeClass("btn-outline-primary").addClass("btn-primary");
    $(".formGroupSelectorElement").removeClass("d-none");
    currentFunction = currentFunctionState;
    mainFunction();
}

// The function that calculates all the necessary data
function mainFunction() {
    const dateFrom = $("#fromDate").val();
    const dateTo = $("#toDate").val();
    const dosage = $("#dosage").val();
    const packageSize = $("#packageSize").val();
    const withdrawls = $("#withdrawls").val();

    if (currentFunction === "uttag") {
        $("#formGroupWithdrawls, #formGroupFromDate").addClass("d-none");
        if (typeof dateTo === 'string') {
            var days = calculateDateDifference();
            if (typeof dosage === 'string') {
                var totalPillsPerDay = calculateTotalPillsPerDay();
                if (packageSize > 0 && totalPillsPerDay > 0 && days > 0) {
                    var withdrawlsCalculated = Math.ceil((days * totalPillsPerDay) / packageSize);
                    var pillsLeftAtEndofPrescription = (packageSize * withdrawlsCalculated) - (days * totalPillsPerDay);
                    var extraDays = pillsLeftAtEndofPrescription / totalPillsPerDay;
                    aktuelltRecept = "Baserat på dosen " + dosage + " från " + dateFrom + " till " + dateTo + " bör patienten erhålla " + withdrawlsCalculated + " stycken uttag á " + packageSize + " tabletter. Totalt antal tabletter för hela perioden blir " + Math.ceil(days * totalPillsPerDay) + " stycken. Vid slutdatum för receptet bör patienten ha kvar " + Math.floor(pillsLeftAtEndofPrescription) + " tabletter, vilket skulle kunna räcka i ytterliggare " + Math.floor(extraDays) + " dagar till och med " + DateTime.fromISO(dateTo).plus({ days: extraDays }).toISODate();;
                    updateReceptText()
                    $("#additionalInfo").html("<hr><i>Om patienten förskrivs 1 paket vid varje uttag kan den tidigast hämta ut ett nytt uttag efter " + Math.floor((packageSize / totalPillsPerDay) / 3 * 2) + " dagar, och 1 uttag räcker som max i " + Math.floor(packageSize / totalPillsPerDay) + " dagar. <a id='toAccordion5' href='#flush-heading5'>Läs mer nedan</a>.</i>").removeClass("d-none");
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
                        aktuelltRecept = `Patientens recept från ${dateFrom} för ${packageSize} tabletter med ${withdrawls} uttag med dosen ${dosage} bör räcka i ytterligare ${remainingDays} dagar. Vid dagens datum ${today.toISODate()} bör det fortfarande finnas kvar ${Math.floor(packageSize * withdrawls - Interval.fromDateTimes(fromDate, today).length('days') * totalPillsPerDay)} tabletter. Om alla tabletter förbrukats till idag har det skett med en snittförbrukning på ${Math.round(((packageSize * withdrawls / Interval.fromDateTimes(fromDate, today).length('days')) + Number.EPSILON) * 10) / 10} tabletter/dag.`;
                    } else {
                        aktuelltRecept = `Patientens recept från ${dateFrom} för ${packageSize} tabletter i ${withdrawls} uttag med dosen ${dosage} bör ha tagit slut ` + toDate.toISODate() + ". Således har patienten varit utan tabletter i " + Math.floor(Interval.fromDateTimes(toDate, today).length('days')) + " dagar.";
                    }
                    updateReceptText()
                }
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
        $("#pReceptText").text(aktuelltRecept);
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
    navigator.clipboard.writeText(aktuelltRecept).then(
        () => {
            $('#kopieraKnapp').html("<i class='bi bi-clipboard-check-fill'></i> Kopierat");
        },
        () => {
            $('#kopieraKnapp').html("Tyvärr stödjer inte din webbläsare kopiering :'(");
        }
    );
}

// Functions to run when the document has loaded completely and to be listened for all the time
$(function () {
    $("#fromDate, #toDate, #dosage, #packageSize, #withdrawls").on("input", mainFunction);

    $('#btnDagar').on('click', function () { setUpInitialForm("dagar", "#btnDagar", "#toDate,#btnToDate", "formGroupToDate") });
    $('#btnUttag').on('click', function () { setUpInitialForm("uttag", "#btnUttag", "#withdrawls") });
    //$('#btnAverage').on('click', function() { setUpInitialForm("average", "#btnAverage", "#dosage")});

    $('.dateDropdown').on('click', function () {
        var element = $(this);
        changeDate(element.data("addorsub"), element.data("numberof"), element.data("timeframe"), element.data("element"));
        mainFunction();
    });

    $(document).on('click', 'a[href^="#"]', function(event) {

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
});