chrome.extension.sendMessage({}, function(response) {
	/*Variables where data will be stored*/
	var scannedData = [];
	var average = 0;
	/*Variables that store if the panel has been extended*/
	var extended1 = false;
	var extended2 = false;
	/*When document is loaded, a button is added before the subject name*/
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			tempTitle = $('.cabpagina').html(); //The subject name is stored
			$('.cabpagina').html('<button id="statsButton">inf</button>'); //Button that opens the panel
			$('.cabpagina').append('<div id="subjectName">'+tempTitle+'</div>'); //An id is added to the subject name to be accesible easily
		}
	}, 10);

	$(document).on('click', '#statsButton', function(event) {
		event.preventDefault();
		/*Getting all the marks from the web page*/
		var marksList = $('tr').not('#panel tr'); //All table rows contain the name and the mark
		for (var i = marksList.length - 1; i >= 1; i--) { //the first element (markList[0]) are the table titles, shouldn't be processed
			var tempName = marksList[i].children[0].innerHTML; //Getting the name
			var tempMark = parseFloat(marksList[i].children[1].innerHTML.replace(',','.')); //Convert the comma to dot so it can be parsed to float
			scannedData.push({name:tempName,mark:tempMark}); //Push the Javascript object with two attributes, name and mark
			average+=tempMark; //Average value is increased
		};
		average = average/marksList.length; //Average calculated as value divided by the number of students
		scannedData.sort(function(a,b){return b.mark - a.mark;}); //All the students are sorted by their mark
		/*The result panel HTML code*/

		/*Panel is added to DOM*/
		$('body').append('<div id="panel"></div>');

		/*Panel inner HTML structure is loaded from the file inject.html*/
		$('#panel').load(chrome.extension.getURL('src/inject/inject.html'), function(){
			/*Subject and exam names are set to their positions in the panel*/
			var subjectName = $('#subjectName').html();
			var examName = $('.container h2').html();
			examName = examName.substr(0,examName.search("&nbsp"));
			/*Setting the names on the panel itself*/
			$('#subject').html(subjectName);
			$('#exam').html(examName);
		});
		/*Animation that makes the panel go down from the top*/
		TweenMax.to($('#panel'),0.5,{ease: Expo.easeOut,opacity:1,top:0});
	});
/*Click event on the calculate button, it processes all the data generating the stats and the graph*/
$(document).on('click', '#calculate', function(event) {
	event.preventDefault();
	/*If the input doesn't have a number it alerts the user*/
	if(isNaN($('#maxScore').val())){
		alert('Tienes que introducir un valor numérico');
	} else {
		var nh = $('#panel').height()+135; //The panel is extended to make room to the children elements
		aux = scannedData.slice(); //The scannedData array is coppied to an auxiliar variable
		var numStudents = aux.length;
		$('#numStudents').html(numStudents);
		var numPassed = 0;
		var maxMark = $('#maxScore').val();
		/*Those who have grater than half the max mark pass, the others fail :(*/
		for (var i = numStudents - 1; i >= 0; i--) {
			if(aux[i].mark > maxMark/2)
				numPassed++;
		};
		$('#numPassed').html(numPassed);
		$('#numFailed').html(numStudents - numPassed);
		/*Average rounded to one decimal*/
		$('#average').html(Math.round(average * 10) / 10);
		/*Cool animations that show the info*/
		if(!extended1){
			TweenMax.to($('#panel'),0.35,{height:nh});
			TweenMax.to($('#stats'),0.35,{delay:0.35,ease: Expo.easeOut,display:'block',opacity:1});
			TweenMax.to($('#panel'),0.35,{delay:0.7,height:nh+175});
			TweenMax.to($('#graphic'),0.35,{delay:1.3,ease: Expo.easeOut,display:'block',opacity:1});
		}
		var incr = maxMark/10; //The histogram consists of 10 bars, each bar has an interval of maxMark/10
		var actualMark = maxMark; //Mark bein analized (the bar that we are counting the students at the moment)
		var pixelGrow = []; //How much height the bar must have. 100px is the max, the values are normalized to 100.
		/*Those who deserve all my respect. Good job!! (5 gratest marks)*/
		for (var i = 1; i <= 5; i++) {
			$('#bestMarkName'+i).html(scannedData[i-1].name);
			$('#bestMarkScore'+i).html(scannedData[i-1].mark);
		};
		/*For each bar, the number of students that have their mark on the interval is counted*/
		for(var i = 10; i >0; i--){
			tmp = 0; //Temporal number of students
			actualMark=actualMark - incr;
			actualMark = Math.round(actualMark * 10) / 10; //Round all the time :)
			while (aux.length > 0 && aux[0].mark >= actualMark){ //If their mark is above the lower limit they're in
				tmp++; //Number increased
				aux.shift(); //Student is remove from the array (remember that they are ordered from max to min)
			}
			/*All the info gathered is dumped to the HTML structure*/
			$('#value'+i).html(actualMark);
			pixelGrow[i] = 100*tmp/numStudents;
			savedHtml = $('#num'+i).first().html();
			$('#num'+i).html(tmp);
			$('#num'+i).append(savedHtml.substr(savedHtml.search('<')));
		}
		/*When all the bar sizes are calculated, the value is dumped to the panel with some nice animation*/
		for (var i = pixelGrow.length - 1; i >= 0; i--) {
			if(!extended1)
				TweenMax.to($('#bar'+i),0.35,{delay:1.35,height:pixelGrow[i]});
			else
				TweenMax.to($('#bar'+i),0.35,{delay:0.35,height:pixelGrow[i]});
		};
		/*More cool anims to display the filter*/
		if(!extended1){
			TweenMax.to($('#panel'),0.35,{delay:2,height:nh+210});
			TweenMax.to($('#filterRow'),0.35,{delay:2.35,ease: Expo.easeOut,display:'block',opacity:1});
		}
		extended1 = true;
	}
});
/*When the filter button is clicked, the student is searched on the scannedData and some info is displayed. It also highlights it's position on the histogram*/
$(document).on('click', '#findStudent', function(event) {
	event.preventDefault();
	for (var i = scannedData.length - 1; i >= 0; i--) {
		if(scannedData[i].name.toLowerCase().search($('#studentName').val().toLowerCase()) >= 0){ //All the comparations in lower case
			$('#name').html(scannedData[i].name); //Name
			$('#mark').html(scannedData[i].mark); //Mark
			$('#absolutePosition').html(i+'/'+scannedData.length); //The absolute position. (how much students are above)
			$('#relativePosition').html(Math.round((i*100/scannedData.length * 10) / 10)+'%'); //The relative position. (how much students are below (in %))
			/*Cool anims*/
			if(!extended2){
				TweenMax.to($('#panel'),0.35,{delay:0.35,height:$('#panel').height()+95});
				TweenMax.to($('#studentInfo'),0.35,{delay:0.7,ease: Expo.easeOut,display:'block',opacity:1});
			}
			/*It's position on the histohram is highlighted*/
			TweenMax.to($('.bar'),1,{ease: Expo.easeOut,backgroundColor:'#d64937'});
			for (var j = 10; j > 0; j--) {
				if(scannedData[i].mark > $('#value'+j).html()){
					if(!extended2)
						TweenMax.to($('#bar'+j),1,{delay:1.25,ease: Expo.easeOut,backgroundColor:'#fff'});
					else
						TweenMax.to($('#bar'+j),1,{ease: Expo.easeOut,backgroundColor:'#fff'});
					break;
				}
			};
			break;
		}
		/*If the student isn't found the user is alerted*/
		if(scannedData[i].name.toLowerCase().search($('#studentName').val().toLowerCase()) < 0 && i==0)
			alert('No se ha encontrado ninguna nota con ese nombre, es posible que haya algún error en el nombre introducido o que no se haya evaluado al alumno.');
	};
	extended2 = true;
});
/*Nice animation thats shows the best 5 marks when the mouse hovers the histogram*/
$(document).on('mouseenter', '#main', function(event) {
	event.preventDefault();
	TweenMax.to($('#main'),0.25,{ease: Expo.easeOut,opacity:0,display:'none'});
	TweenMax.to($('#secondary'),0.25,{delay:0.255,ease: Expo.easeOut,display:'table',opacity:1});
});
$(document).on('mouseleave', '#secondary', function(event) {
	event.preventDefault();
	TweenMax.to($('#secondary'),0.25,{ease: Expo.easeOut,opacity:0,display:'none'});
	TweenMax.to($('#main'),0.25,{delay:0.255,ease: Expo.easeOut,display:'table',opacity:1});
});
/*Shows the author informarion*/
$(document).on('click', '#info', function(event) {
	event.preventDefault();
	$('body').append('<div id="infoPanel"></div>');
	$('#infoPanel').load(chrome.extension.getURL('src/inject/infopanel.html'));
	TweenMax.to($('#infoPanel'),0.5,{ease: Expo.easeOut,display:'flex',opacity:1});
});
$(document).on('click', '#close', function(event) {
	event.preventDefault();
	TweenMax.to($('#infoPanel'),0.5,{ease: Expo.easeOut,opacity:0,display:'none'});
	TweenMax.to($('#panel'),0.5,{ease: Expo.easeOut,opacity:0});
});
$(document).on('click', '#closeInfo', function(event) {
	event.preventDefault();
	TweenMax.to($('#infoPanel'),0.5,{ease: Expo.easeOut,opacity:0,display:'none'});
});
});