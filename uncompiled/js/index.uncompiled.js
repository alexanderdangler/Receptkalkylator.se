var { DateTime, Interval } = require("luxon"); //imports Luxon
// to browswerify: 
// browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js

var currentFunction;

// Function that manipulate the form and turns off/"disables" the input boxes not used
function setUpInitialForm(currentFunctionState, buttonSelector, stateId) {
    $("#alertReceptInfo").removeClass("d-none");
    $(".btnSelector").addClass("btn-outline-primary").removeClass("btn-primary");
    $("input,button").removeAttr("disabled");
    $(buttonSelector).removeClass("btn-outline-primary").addClass("btn-primary");
    $(stateId).prop("disabled",true);
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

    if(currentFunction === "uttag") { 
        $(".btnExtraInfo").text("");
        if(typeof dateFrom === 'string' && typeof dateTo === 'string') {
            var days = calculateDateDifference();
            if(typeof dosage === 'string') {
                var totalPillsPerDay = calculateTotalPillsPerDay();
                if(typeof packageSize === 'string') {
                    var withdrawlsDays = Math.ceil((days * totalPillsPerDay) / packageSize);
                    $("#withdrawls").val(withdrawlsDays);
                    $("#btnUttagSpan").text(": " + withdrawlsDays + " uttag");
                }
            }
        }                    
    }

    if(currentFunction === "dagar") { 
            $(".btnExtraInfo").text("");
            if(typeof dosage === 'string') {
                var totalPillsPerDay = calculateTotalPillsPerDay();
                if(typeof packageSize === 'string' && typeof withdrawls === 'string') {
                    var days = Math.ceil((packageSize * withdrawls) / totalPillsPerDay);
                    if(typeof dateFrom === 'string') {
                        var toDate = DateTime.fromISO(dateFrom).plus({days: days});
                        var today = DateTime.now();
                        $("#toDate").val(toDate.toISODate());
                        if(toDate > today) {
                            var remainingDays = Math.ceil(toDate.diff(today).as('days'));
                            $("#btnDagarSpan").text(": " + remainingDays + " dagar");
                        } else {
                            $("#btnDagarSpan").text(": Receptet tog slut " + toDate.toISODate());
                        }
                    }
                }
            }                
    }

    if(currentFunction === "average") { 
        $(".btnExtraInfo").text("");
        if(typeof dateFrom === 'string' && typeof dateTo === 'string') {
            var days = calculateDateDifference();
            if(typeof packageSize === 'string' && typeof withdrawls === 'string') {
                var totalPills = packageSize * withdrawls;
                var pillsPerDay = totalPills / days;
                pillsPerDay = Math.round((pillsPerDay + Number.EPSILON) * 10) / 10;
                $("#dosage").val(pillsPerDay + "x1");
                $("#btnAverageSpan").text(": " + pillsPerDay + " tabletter/dag");
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

// ChangeDate is a function called from HTML-elements in the DOM via an onClick-handler
function ChangeDate(addOrSub, numberOf, timeFrame, element) {
    if(addOrSub === "+") {
        var date = DateTime.now().plus({[timeFrame]: numberOf}).toISODate();
    } else if (addOrSub === "-") {
        var date = DateTime.now().minus({[timeFrame]: numberOf}).toISODate();
    }
    $(element).val(date);
    mainFunction();
}
        
// Functions to run when the document has loaded completely and to be listened for all the time
$(function () {
    $("#fromDate, #toDate, #dosage, #packageSize, #withdrawls").on("input", mainFunction);

    $('#btnDagar').on('click', function() { setUpInitialForm("dagar", "#btnDagar", "#toDate,#btnToDate")});
    $('#btnUttag').on('click', function() { setUpInitialForm("uttag", "#btnUttag", "#withdrawls")});
    $('#btnAverage').on('click', function() { setUpInitialForm("average", "#btnAverage", "#dosage")});

    $('.dateDropdown').on('click', function() { var element = $( this ); ChangeDate(element.data("addorsub"), element.data("numberof"), element.data("timeframe"), element.data("element"))});

});