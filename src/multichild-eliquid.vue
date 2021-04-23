<template>
    <div class="productview-options">
        <div v-if="options.length > 0" class="form-block w-form">
            <div class="child-grid-container">
                <div class="child-grid-select-text">{{ lang.langSelectItems }}</div>
                <div class="child-grid-qty-disclaimer">Quantities entered may be adjusted to reflect stock on hand</div>
                <div class="child-grid-th">
                    
                    <div class="child-grid-th-item-name eliquid">
                        <div>{{indexY}}</div>
                    </div>
                    <div class="child-grid-th-item-options">
                        <div>{{indexX}}</div>
                    </div>
                    <div class="child-grid-th-price eliquid">
                        <div>{{ lang.langPrice }}</div>
                    </div>                    
                </div>
                <div class="child-grid-rows">
                    <div class="child-grid-row" v-for="(group, groupIndex) in variants">
                        <div>
                         
                            <div class="child-grid-row-item-name eliquid">

                                <div class="child-item-image-container">
                                    <img :src="group.image_url" class="child-item-image" v-if="group.image_url !== '' && group.image_url !== null">
                                </div>
                                <div class="child-item-name-container">
                                    <div>{{ group.label }}</div>
                                </div>
                            </div> 
                            <div class="child-grid-row-item-options">
                                
                                <div class="child-item-options-container" v-bind:class="{'even': group.options.length % 2 == 0}">                     
                                    <div class="child-item-option-container" v-for="(option, optionIndex) in group.options">
                                        <div class="child-item-option-label">{{ option.label }} <span class="priceDiff" v-if="option.priceDifference">(+{{ lang.langCurrencyToken }}{{formatPrice(option.priceDifference)}})</span></div>
                                        <input
                                            type="text"
                                            class="child-grid-qty-field w-input"
                                            maxlength="256"
                                            placeholder="0"
                                            value="0"
                                            min="0"
                                            :data-optionValues="option.option_values_string"
                                            :data-optionprice="option.price"
                                            :max="option.inventory_level"
                                            @input="optionSelected()"
                                            v-if="option.inventory_level > 0"
                                            :disabled="!customer"
                                        >
                                        <div v-else class="soldout">Sold Out</div>
                                        
                                    </div>
                                </div>
                                <div class="child-item-price-container">
                                    <div class="child-item-price-label">
                                        <div>{{ lang.langPrice }}</div>
                                    </div>
                                    <div class="child-item-price-value" v-if="customer">{{ lang.langCurrencyToken }}{{ formatPrice(group.price) }}</div>
                                    <div class="child-item-price-value not-logged-in" v-else>Login for pricing</div>

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            <div class="child-grid-atc-button" v-if="customer">
                <div class="product-free-shipping" v-if="freeShipping">
                    <img src="/content/icons/product-badge-free-shipping.svg" alt="Free Shipping!" class="product-free-shipping-badge">
                </div>
                <button v-if="total > 0" class="form-addtocart-childgrid w-button" @click.stop="addToCart()" :disabled="addToCartDisabled" type="button">{{ addToCartMessage }}<span class="btn-loading"><i class="fa fa-circle-o-notch fa-spin"></i></span></button>
                <div class="child-grid-total-container">
                    <div class="child-grid-total-label">{{ lang.langTotal }}</div>
                    <p class="product-price child-grid-total-price">
                        <span class="product-price-dollar">{{ lang.langCurrencyToken }}</span>{{ total ? formatPrice(total) : formatPrice(0) }}
                    </p>
                </div>
               
            </div>
        </div>
    </div>
</template>

<script>


import _ from 'lodash';

import addToCartRequest from './add-to-cart';

export default {
    name: 'bl-multichild', 
    data () {
        return {
            options: [],
            total: 0,
            product_id: 0,
            partial: [],
            addToCartDisabled: false,
            freeShipping: false,
            lang: {},
            addToCartMessage: '',
            indexY: '',
            indexX: '',
            customer: null
        };
    },
    computed: {
        variants: function() {
            let self = this;
            let variants = [];
            let grouped = _.groupBy(this.options, (opt) => {
                if(opt.option_values && opt.option_values.length === 2) {

                    if(!self.indexY || !self.indexX) {
                        self.indexX = _.trim(opt.option_values[0].option_display_name);
                        self.indexY = _.trim(opt.option_values[1].option_display_name);
                    }

                    let groupBy = _.find(opt.option_values, (ov) => {
                        return _.trim(ov.option_display_name).toLowerCase() == self.indexY.toLowerCase();
                    });

                    if(!groupBy) {
                        return '';
                    }
                    
                    return groupBy.label;
                } else{
                    return '';
                }
                
            });


            _.each(grouped, (g, l) => {
                if(l === '') { return; }

                //Set the initial price to a high number so we can compare it later
                let price = 100000000;
                let image_url = null;
                let options = [];
                _.each(g, (o) => {
                    let optionValues = [];

                    /*_.each(o.option_values, (ov) =>{
                        optionValues.push(ov.option_id + ":" + ov.id);
                    });*/

                    if(o.calculated_price < price) {
                        price = o.calculated_price;
                    }
                    if(o.image_url !== '' && image_url === null) {
                        image_url = o.image_url;
                    }
                    o.priceDifference = o.calculated_price - price;

                    let labelOption = _.find(o.option_values, (ov) => {
                        return _.trim(ov.option_display_name).toLowerCase() == _.trim(self.indexX.toLowerCase());
                    });
                    if(labelOption) {
                        o.label = labelOption.label;
                    }
                    

                    // o.optionValues = optionValues.join('|');
                    options.push(o);
                });

                let group = {
                    label: l,
                    image_url: image_url,
                    price: price,
                    options: options
                }
                variants.push(group);
            });

            return variants;
        },
        hasImages: function() {
            return _.some(this.options, (v) => {
                return v.image_url !== null && v.image_url !== '';
            });
        }
    },
    methods: {
        updateOptions(optionIndex, attributes) {
            Object.assign(this.options[optionIndex], attributes);
        },

        // When a row checkbox is checked we get all checked rows input values and add them up to update the Total value so far.
         optionSelected() {
            this.total = 0;

            this.$el.querySelectorAll('.child-grid-qty-field')
                .forEach($input => {
                   let value = $input.value;

                    if(isNaN(value)) {
                        $input.value = 0;
                        return;
                    }
                    
                    if ($input.value == 0) return;

                    let max = parseInt($input.max, 10);

                    const price = parseFloat($input.dataset['optionprice'], 10);
                    let qty = parseInt($input.value, 10);

                    if(qty > max) {
                        qty = max;
                        $input.value = qty;
                    }

                    this.total += price * qty;
                });
        },

        // We need to add to cart each combination of option values serialy because BigCommerce requires that, that's why we;re using a for...loop and then update the Add to cart button and redirect the customer into Cart page
        async addToCart() {
            this.errors = [];
            this.$el.classList.add('is-loading');
            this.addToCartMessage = 'Adding to Cart';
            this.addToCartDisabled = true;
            let promises = [];
            const $qtyboxes = this.$el.querySelectorAll('.child-grid-qty-field');
            for (let qtyboxIndex = 0; qtyboxIndex < $qtyboxes.length; qtyboxIndex += 1) {
                const $qtybox = $qtyboxes[qtyboxIndex];
                
                if ($qtybox.value == 0) continue;

                const $parent = $qtybox.closest('.child-grid-row');
                const $inputField = $parent.querySelector('.child-grid-qty-field');

                const qty = parseInt($qtybox.value, 10);
                const options= $qtybox.dataset['optionvalues'];

                
                
                promises.push(await addToCartRequest(this.product_id, options, qty));                
                
                $qtybox.value = 0;
            }

            Promise.allSettled(promises).then((results) => {
                let response = null;
                _.each(results, (r) => {                    
                    if(r.status == 'rejected') { 
                        this.errors.push(r.reason);
                    } else {
                        response = r.value;
                    }
                });



                if(this.errors.length === 0) { 
                    if(typeof window.openPreviewModal == 'function' && response && response.data && response.data.cart_item && response.data.cart_item.hash) {
                        window.openPreviewModal(response.data.cart_item.hash);
                    } else {
                        window.location.href = '/cart.php';
                    }
                    
                } else {
                    
                    if(typeof window.openPreviewModal == 'function' && response && response.data && response.data.cart_item && response.data.cart_item.hash) {
                        window.openPreviewModal(response.data.cart_item.hash);
                    } else {
                        window.location.href = '/cart.php';
                    }
                }
                 this.resetForm();
                //this.total = 0;
                //window.location.href = '/cart.php';
            });

            
           
        },
        /*
         * Reset the form after an add to cart
         * @returns void
         */
        resetForm() {
            this.addToCartDisabled = false;
            this.$el.classList.remove('is-loading');                
            this.addToCartMessage = 'Add to Cart';
            this.total = 0;
            
        },

        /*
         * We format the price using current locale settings
         * @param   {number}
         * @returns {string}
         */
        formatPrice(price) {
            if ('Intl' in window) {
                return new Intl.NumberFormat(Intl.NumberFormat().resolvedOptions().locale, { minimumFractionDigits: 2 }).format(price);
            }

            return price.toFixed(2);
        }
    }
}
</script>
