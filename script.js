const weatherIconMap = {
    "partly-cloudy-day": "icons/partly-cloudy-day.png",
    "partly-cloudy-night": "icons/partly-cloudy-night.png",
    "cloudy-day": "icons/cloudy-day.png",
    "cloudy-night": "icons/cloudy-night.png",
    "clear-day": "icons/clear-day.png",
    "clear-night": "icons/clear-night.png",
    "rain": "icons/rain.png",
    "snow": "icons/snow.png",
    "thunderstorm":"icons/thunderstorm.png",
    "smoke":"icons/smoke.png",
};
let num;
let lastValidData = null; 
let lastCity=null;

function showLoading() {
    document.getElementById("loading").classList.remove("hidden");
}

function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
}

function clearUI() {
    document.querySelector(".first.column").innerHTML = "";
    document.querySelector(".second.column").innerHTML = "";
    document.querySelector(".week").innerHTML = "";
}

function showError(){
    const err=document.createElement("p");
    err.classList.add("err");
    err.textContent="Enter a valid city";
    document.querySelector(".first.column").appendChild(err);
}

async function getTemperature(city){
    try{
        clearUI();
        showLoading();
        lastCity = city;
        const response = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=metric&key=JW4Y277F9AQERBFM6RHGZ3AH4&contentType=json`);
        if(!response.ok){
            throw new Error("City not found or API error");
        }
        const object = await response.json();
        lastValidData = object;
        await buildFirstColumn(object);
        buildSecondColumn(object);
        buildWeek(object);
        hideLoading();
        console.log(object);
    }
    catch{
        await buildFirstColumn(lastValidData);
        hideLoading();
        buildSecondColumn(lastValidData);
        buildWeek(lastValidData);
        document.querySelector("input").value=lastCity;
        showError();
    }
}


async function getTime(timezone){
    const response = await fetch(`http://worldtimeapi.org/api/timezone/${timezone}`);
    const data = await response.json();
    return extractTimeInfo(data);
}

function extractTimeInfo(data) {
    const indexOfT=data.datetime.indexOf("T");
    const indexOfPoint=data.datetime.indexOf(".");

    const rawDate = data.datetime.slice(0, indexOfT);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[Number(rawDate.slice(5, 7))-1];
    const day = rawDate.slice(8, 10);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[data.day_of_week];
    num=daysOfWeek.indexOf(dayOfWeek);

    const first=`${month} ${day}, ${dayOfWeek}`;
    const second=data.datetime.slice(indexOfT+1, indexOfPoint-3);

    return {first, second};
}




async function buildFirstColumn(object){
    const firstColumn=document.querySelector(".first.column");

    const {first, second} = await getTime(object.timezone);
    const iconUrl = weatherIconMap[object.currentConditions.icon] || "icons/default.png";

    firstColumn.appendChild(buildDescription(object.currentConditions.conditions));
    firstColumn.appendChild(buildCity(object.address));
    firstColumn.appendChild(buildDateTime(first, second));
    firstColumn.appendChild(buildTemp(object.currentConditions.temp));
    firstColumn.appendChild(buildIcon(iconUrl));
    firstColumn.appendChild(buildSearch());
}

function buildSecondColumn(object){
    const secondColumn=document.querySelector(".second.column");

    secondColumn.appendChild(buildBlock(object, "Feels Like", "feelslike", "./images/feelslike.png"));
    secondColumn.appendChild(buildBlock(object, "Humidity", "humidity", "./images/humidity.png"));
    secondColumn.appendChild(buildBlock(object, "Chance of Precipitation", "precipprob", "./images/rainn.png"));
    secondColumn.appendChild(buildBlock(object, "Wind Speed", "windspeed", "./images/wind.png"));
}



function buildBlock(object, text1, property, source){
    const first=document.createElement("div");
    const firstImg=document.createElement("img");
    firstImg.src=source;
    const textt=document.createElement("div");
    
    const firstP=document.createElement("p");
    firstP.textContent=text1;
    const secondP=document.createElement("p");
    switch(text1){
        case "Feels Like":
            secondP.textContent=object.currentConditions[property]+"℃";
            break;
        case "Wind Speed":
            secondP.textContent=object.currentConditions[property]+" km/h";
            break;
        default:
            secondP.textContent=object.currentConditions[property]+"%";

    }

    textt.appendChild(firstP);
    textt.appendChild(secondP);

    first.appendChild(firstImg);
    first.appendChild(textt);
    return first;
}


function buildWeek(object){
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const week=document.querySelector(".week");
    for(let i=1; i<8; i++){
        const day=daysOfWeek[(num+i)%7];
        const mintemp=object.days[i].tempmin;
        const maxtemp=object.days[i].tempmax;
        const icon=object.days[i].icon;
        week.appendChild(buildCard(day, maxtemp, mintemp, icon));
    }
}

function buildCard(day, maxtemp, mintemp, icon){
    const card=document.createElement("div");
    card.classList.add("card");

    const day1=document.createElement("p");
    day1.textContent=day;

    const temp=document.createElement("div");
    const maxtemp1=document.createElement("p");
    maxtemp1.textContent=maxtemp+"℃";
    const mintemp1=document.createElement("p");
    mintemp1.textContent=mintemp+"℃";
    temp.appendChild(maxtemp1);
    temp.appendChild(mintemp1);

    const img1=document.createElement("img");
    img1.src=weatherIconMap[icon] || "./icons/default.png";

    card.appendChild(day1);
    card.appendChild(temp);
    card.appendChild(img1);
    return card;
}




function buildDescription(desc){
    const description = document.createElement("div");
    description.classList.add("description");
    description.textContent = desc;
    return description;
}

function buildCity(cit){
    const city = document.createElement("div");
    city.classList.add("city");
    city.textContent = cit;
    return city;
}

function buildDateTime(firs, secon){
    const dateTime = document.createElement("div");
    dateTime.classList.add("dateTime");

    const first=document.createElement("p");
    first.textContent=firs;
    const second=document.createElement("p");
    second.textContent=secon;

    dateTime.appendChild(first);
    dateTime.appendChild(second);
    return dateTime;
}

function buildTemp(tem){
    const temp = document.createElement("div");
    temp.classList.add("temp");
    temp.textContent = tem+"℃";
    return temp;
}

function buildIcon(iconUrl){
    const img=document.createElement("img");
    img.classList.add("icon");
    img.src=iconUrl;
    return img;
}

function buildSearch(){
    const search=document.createElement("div");
    search.classList.add("search");

    const input=document.createElement("input");
    input.placeholder="Search City...";

    const button=document.createElement("button");
    
    button.addEventListener("click", ()=>{
        getTemperature(input.value);
    });
    input.addEventListener('keyup', (event) => {
        if(event.key === 'Enter')
            getTemperature(input.value);
    });

    search.appendChild(input);
    search.appendChild(button);
    return search;
}

getTemperature("Daejeon");