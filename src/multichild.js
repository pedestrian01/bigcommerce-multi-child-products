import Vue from 'vue';
import multichild from './multichild.vue';
import multichildEliquid from './multichild-eliquid.vue';
import _ from 'lodash';

export default function ($scopeBuilder, context, vueContainerSelector = '.js-multichild') {
    const rows = [];
    const rowLimits = [];
    const rowObjects = [];
    const newOptions = [];

    // First, we create an Array [[rows]] to initialize some counters based on number of options provided
    // We also create qn Array [[rowLimits]] with the length of each option values so we can count up to that number for each option
    // Then, we create a new array with just what we need from the context data which is the option ID and the values IDs and labels and save this data into [[rowObjects]]
    

    const lang = {};
    for (const contextProperty in context) {
        if (contextProperty.startsWith('lang')) {
            lang[contextProperty] = context[contextProperty];
        }
    }
    let templ = multichild;
    if((context.productType && context.productType == 'eliquid') && context.options.length == 2) {
        templ = multichildEliquid;
    }

    


    // we instantiate our Vue element
    const builder = (new Vue({
        el: vueContainerSelector,
        render: h => h(templ),
        scope: $scopeBuilder,
    })).$children[0];

    builder.options = [];
    builder.product_id = context.product_id;
    builder.lang = lang;
    builder.addToCartMessage = lang.langAddToCart;
    builder.freeShipping = !!document.querySelector('.product-free-shipping');

    
    const req = new XMLHttpRequest;

    req.open('GET', `https://thecloudsupply.mbennett.biz/option_vartiants.php?product_id=${context.product_id}`);
   // req.withCredentials = true;
    

    req.addEventListener('load', event => {
        
        if (event.target.response) {
            const response = JSON.parse(event.target.response);

            let variants = response.variants;
            let axisOptions = response.axisOptions;

            if(axisOptions && axisOptions.x && axisOptions.y) {
                builder.$set(builder, 'indexY', axisOptions.y);
                builder.$set(builder, 'indexX', axisOptions.x);
            }
            
            
            builder.$set(builder, 'options', variants);

            builder.$set(builder, 'customer', context.customer);

            /*let price = 'without_tax' in response.data.price ? response.data.price.without_tax.value : 0;
            price = 'with_tax' in response.data.price ? response.data.price.with_tax.value : price;

            const invisible = response.data.base; // If the option values combination doesn't exist, the [[base]] attribute is true
            const instock = ('instock' in response.data) ? response.data.instock : true;

            builder.$set(builder.options, newOptionIndex, Object.assign(builder.options[newOptionIndex], { sku: response.data.sku, price, invisible, instock }));*/
        }
    });

    req.send();
}
