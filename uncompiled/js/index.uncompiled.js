var { DateTime, Interval } = require("luxon"); //imports Luxon
// to browswerify: 
// browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js

var currentFunction;
var aktuelltRecept;

// Function that manipulate the form and turns off/"disables" the input boxes not used
function setUpInitialForm(currentFunctionState, buttonSelector, stateId) {
    $("#alertReceptInfo").addClass("d-none");
    $(".btnSelector").addClass("btn-outline-primary").removeClass("btn-primary");
    $("input,button").removeAttr("disabled");
    $(buttonSelector).removeClass("btn-outline-primary").addClass("btn-primary");
    $(stateId).prop("disabled",true);
    currentFunction = currentFunctionState;
    switch(currentFunction) {
        case "uttag":
            changeDate("+", "0", "days", "#fromDate");
            break;
        case "average":
            changeDate("+", "0", "days", "#toDate");
            break;
    }
    mainFunction();
}

// The function that calculates all the necessary data
function mainFunction() {
    const dateFrom = $("#fromDate").val();
    const dateTo = $("#toDate").val();
    const dosage = $("#dosage").val();
    const packageSize = $("#packageSize").val();
    const withdrawls = $("#withdrawls").val();

    if(currentFunction === "uttag") { 
        $(".btnExtraInfo").text("");
        if(typeof dateFrom === 'string' && typeof dateTo === 'string') {
            var days = calculateDateDifference();
            if(typeof dosage === 'string') {
                var totalPillsPerDay = calculateTotalPillsPerDay();
                if(packageSize > 0 && totalPillsPerDay > 0 && days > 0) {
                    var withdrawlsCalculated = Math.ceil((days * totalPillsPerDay) / packageSize);
                    var pillsLeftAtEndofPrescription = (packageSize * withdrawlsCalculated) - (days * totalPillsPerDay);
                    var extraDays = pillsLeftAtEndofPrescription / totalPillsPerDay;
                    $("#withdrawls").val(withdrawlsCalculated);
                    $("#btnUttagSpan").text(": " + withdrawlsCalculated + " uttag");
                    aktuelltRecept = "Baserat på dosen " + dosage + " från " + dateFrom + " till " + dateTo + " bör patienten erhålla " + withdrawlsCalculated + " stycken uttag á " + packageSize + " tabletter. Totalt antal tabletter för hela perioden blir " + Math.ceil(days * totalPillsPerDay) + " stycken. Vid slutdatum för receptet bör patienten ha kvar " + Math.floor(pillsLeftAtEndofPrescription) + " tabletter, vilket skulle kunna räcka i ytterliggare " + Math.floor(extraDays) + " dagar till och med " + DateTime.fromISO(dateTo).plus({days: extraDays}).toISODate();;
                    updateReceptText()
                }
            }
        }                    
    }

    if(currentFunction === "dagar") { 
            $(".btnExtraInfo").text("");
            if(typeof dosage === 'string') {
                var totalPillsPerDay = calculateTotalPillsPerDay();
                if(packageSize > 0 && withdrawls > 0 && totalPillsPerDay > 0) {
                    var days = Math.ceil((packageSize * withdrawls) / totalPillsPerDay);
                    if(typeof dateFrom === 'string') {
                        var toDate = DateTime.fromISO(dateFrom).plus({days: days});
                        var fromDate = DateTime.fromISO(dateFrom);
                        var today = DateTime.now();
                        $("#toDate").val(toDate.toISODate());
                        if(toDate > today) {
                            var remainingDays = Math.ceil(toDate.diff(today).as('days'));
                            $("#btnDagarSpan").text(": " + remainingDays + " dagar");
                            aktuelltRecept = `Patientens recept från ${dateFrom} för ${packageSize} tabletter med ${withdrawls} uttag med dosen ${dosage} bör räcka i ytterligare ${remainingDays} dagar. Vid dagens datum ${today.toISODate()} bör det fortfarande finnas kvar ${Math.floor(packageSize * withdrawls - Interval.fromDateTimes(fromDate, today).length('days') * totalPillsPerDay)} tabletter. Om alla tabletter förbrukats till idag har det skett med en snittförbrukning på ${Math.round(((packageSize * withdrawls / Interval.fromDateTimes(fromDate, today).length('days')) + Number.EPSILON) * 10) / 10} tabletter/dag.`;
                        } else {
                            $("#btnDagarSpan").text(": Receptet tog slut " + toDate.toISODate());
                            aktuelltRecept = `Patientens recept från ${dateFrom} för ${packageSize} tabletter i ${withdrawls} uttag med dosen ${dosage} bör ha tagit slut ` + toDate.toISODate() + ". Således har patienten varit utan tabletter i " + Math.floor(Interval.fromDateTimes(toDate, today).length('days')) + " dagar.";
                        }
                        updateReceptText()
                    }
                }
            }                
    }

    if(currentFunction === "average") { 
        $(".btnExtraInfo").text("");
        if(typeof dateFrom === 'string' && typeof dateTo === 'string') {
            var days = calculateDateDifference();
            if(packageSize > 0 && withdrawls > 0 && days > 0) {
                var totalPills = packageSize * withdrawls;
                var pillsPerDay = totalPills / days;
                pillsPerDay = Math.round((pillsPerDay + Number.EPSILON) * 10) / 10;
                $("#dosage").val(pillsPerDay + "x1");
                $("#btnAverageSpan").text(": " + pillsPerDay + " tabletter/dag");
                var toDate = DateTime.fromISO(dateFrom).plus({days: days});
                var today = DateTime.now();
                aktuelltRecept = `Patientens fick ett recept ${dateFrom} för ${packageSize} tabletter med ${withdrawls} uttag. Om alla tabletter förbrukats till idag har det skett med en snittförbrukning på ${pillsPerDay} tabletter/dag.`;
                updateReceptText()
            }
        }                    
    }

    function calculateDateDifference() {       
        var now = DateTime.fromISO(dateFrom);
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

        if(dos.search(/\+/) > 0) {
            function evaluateDos(fn) { // This function is to circumvent security risk with Math.eval()
                return new Function('return ' + fn)();
              }
            totalPillsPerDay = evaluateDos(dos);
        } else {
            let antal = /([0-9.]+)/.exec(dos);
            let tillfallen = /([0-9]+)/.exec(/x([0-9]+)/.exec(dos));
            if(tillfallen !== null) {
                totalPillsPerDay = antal[0] * tillfallen[0];
            } else {
                totalPillsPerDay = antal[0];
            }
        }
        
        return totalPillsPerDay;
    }
}

function changeDate(addOrSub, numberOf, timeFrame, element) {
    if(addOrSub === "+") {
        var date = DateTime.now().plus({[timeFrame]: numberOf}).toISODate();
    } else if (addOrSub === "-") {
        var date = DateTime.now().minus({[timeFrame]: numberOf}).toISODate();
    }
    $(element).val(date);
}

function copyAktuelltReceptToClipboard() {
    navigator.clipboard.writeText(aktuelltRecept).then(
        () => {
            $('#kopieraKnapp').html("<i class='bi bi-clipboard-check-fill'></i> Kopierat");
        },
        () => {
          console.log("Gick ej att kopiera");
        }
      );
}
        
// Functions to run when the document has loaded completely and to be listened for all the time
$(function () {
    $("#fromDate, #toDate, #dosage, #packageSize, #withdrawls").on("input", mainFunction);

    $('#btnDagar').on('click', function() { setUpInitialForm("dagar", "#btnDagar", "#toDate,#btnToDate")});
    $('#btnUttag').on('click', function() { setUpInitialForm("uttag", "#btnUttag", "#withdrawls")});
    $('#btnAverage').on('click', function() { setUpInitialForm("average", "#btnAverage", "#dosage")});

    $('.dateDropdown').on('click', function() { 
        var element = $( this ); 
        changeDate(element.data("addorsub"), element.data("numberof"), element.data("timeframe"), element.data("element"));  
        mainFunction();
    });

    $('#kopieraKnapp').on('click', copyAktuelltReceptToClipboard);
});