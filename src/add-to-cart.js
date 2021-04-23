

/**
* Adds product to cart
* productId: The id of the product 
* options: A pipe deliminated list of colon deliminated optionIds and valueIds
* qty: The amount to add to cart
**/
export default async function(productId, options, qty){

	return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest;

        req.open('POST', '/remote/v1/cart/add');
        req.withCredentials = true;

        req.setRequestHeader('stencil-config', '{}');
        req.setRequestHeader('stencil-options', '{}');

        const formdata = new FormData;
        formdata.append('action', 'add');
        formdata.append('child-add', 'on');

        let optionValues = options.split('|');
        optionValues.forEach(ov => {
        	let option = ov.split(':');
        	if(option.length !== 2){
        		return;
        	}
            formdata.append(`attribute[${option[0]}]`, option[1]);
        });

        formdata.append('product_id', productId);
        formdata.append('qty[]', qty);

        req.addEventListener('load', () => {
            //TODO: Remove automatic resolve and display errors 
            let responseJson = JSON.parse(req.responseText);
            resolve(responseJson);

            if(responseJson && responseJson.data && responseJson.data.error) {
                reject(responseJson.data.error)
            }
            else {
                resolve(responseJson);
            }
        });
        req.send(formdata);
    });
}