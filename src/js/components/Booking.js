import {select, templates, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

export class Booking{
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,

      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,

      ],
      eventsRepeat:[
        settings.db.repeatParam,
        endDateParam,

      ],
    };
    console.log('getData.params', params);
    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };
    // console.log('urls', urls);
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });

  }
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
        
      }
    }
    thisBooking.updateDOM();


  }
  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);
    
    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
  } 
  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }
    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } 
      else {
        table.classList.remove(classNames.booking.tableBooked);
        thisBooking.bookTable(table);
        
      }
      

    }
  }
  bookTable(table){
    const thisBooking = this;
   
    table.addEventListener('click', function(){
      const thisTable = this;
      thisTable.classList.add(classNames.booking.tableBooked);
      thisBooking.bookedTable = thisTable.getAttribute(settings.booking.tableIdAttribute);

      let tableId = thisTable.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      thisBooking.resetDuration();
      thisBooking.hoursAmount.unbookedDuration = thisBooking.unbookedDuration(tableId);

      thisBooking.dom.datePicker.addEventListener('click', function(){
        thisTable.classList.remove(classNames.booking.tableBooked);
        thisBooking.updateDOM();
      });
      thisBooking.dom.hourPicker.addEventListener('click', function(){
        thisTable.classList.remove(classNames.booking.tableBooked);
        thisBooking.updateDOM();
      });

    });
  }
  resetDuration(){
    const thisBooking = this;
    thisBooking.hoursAmount.unbookedDuration = settings.amountWidget.defaultMax;
    thisBooking.hoursAmount.setValue(settings.amountWidget.defaultMin);

  }
  unbookedDuration(tableId){
    const thisBooking = this;


    let duration = 0;
    for (let hourBlock = thisBooking.hour; hourBlock < 24; hourBlock += 0.5){
      console.log('booking', thisBooking.booked[thisBooking.date][hourBlock]);
      if(typeof thisBooking.booked[thisBooking.date][hourBlock] == 'undefined'){
        duration += 0.5;
        console.log('duration',duration);

      }else if(thisBooking.booked[thisBooking.date][hourBlock].includes(tableId) == false){
        duration += 0.5;
        console.log('duration',duration);
      }else{
        break; }    
    }
    return duration;
        
  }
    

  

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.appendChild(generatedDOM);
    
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
  }

  initWidgets(){
    const thisBooking = this;
    
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount, 1);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount, 0.5);     
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker); 
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.datePicker.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
    thisBooking.dom.hourPicker.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });


    thisBooking.dom.form.addEventListener('submit',function(event){
      event.preventDefault();
      thisBooking.sendOrder();
    });

    
  }
  sendOrder(){
    const thisBooking = this;
    thisBooking.dom.people = document.querySelector(select.booking.people);
    thisBooking.dom.duration = document.querySelector(select.booking.duration);
    thisBooking.dom.phone = document.querySelector(select.booking.phone);
    thisBooking.dom.address = document.querySelector(select.booking.address);
    thisBooking.dom.starters = document.querySelectorAll(select.booking.starters);

    const url = settings.db.url + '/' + settings.db.booking;
    

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.bookedTable),
      duration: thisBooking.dom.duration.value,
      ppl: thisBooking.dom.people.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,

    };
    for(let starter of thisBooking.dom.starters){
      console.log('starter', starter);
      if(starter.checked){
        payload.starters.push(starter.value);
      }
      
    }
  
   

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url,options)
      .then(function(response){
        return response.json();
      }).then(function(){
        thisBooking.getData();
      });
  }


}