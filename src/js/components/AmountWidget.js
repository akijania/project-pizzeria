import {select, settings} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget{
  constructor(element, step){
    super(element, settings.amountWidget.defaultValue);

    const thisWidget = this;

    thisWidget.unbookedDuration = settings.amountWidget.defaultMax;

    thisWidget.getElements(element);

    thisWidget.initActions(step);
    // console.log('AmountWidget', thisWidget);
    // console.log('constructor arguments:', element);
  }

  getElements(){
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  isValid(value){
    const thisWidget = this;
    return !isNaN(value)
    && value >= settings.amountWidget.defaultMin
    && value <= thisWidget.unbookedDuration 
    && value <= settings.amountWidget.defaultMax;
  }
  renderValue(){
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }


  initActions(step){
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      // thisWidget.setValue(thisWidget.dom.input.value);
      thisWidget.value = thisWidget.dom.input.value;
    });
    thisWidget.dom.linkDecrease.addEventListener('click', function(){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - step);
    });
    thisWidget.dom.linkIncrease.addEventListener('click', function(){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + step);
    });

  }
  

}
export default AmountWidget;