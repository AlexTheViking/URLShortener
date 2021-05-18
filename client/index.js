
let input;
let button; 

window.onload = () => {

    input = document.querySelector(".inpt");
    button = document.querySelector(".btn");
    output = document.querySelector(".short_url");
    warn = document.querySelector(".warn");

    output.addEventListener('click',(event) => {
        navigator.clipboard.writeText(output.firstElementChild.innerText)
        .then(() => {
            output.children[1].classList.remove('hidden');
        })
        .catch(err => {
            console.log('Something went wrong', err);
        });
    });

    button.addEventListener('click', (event) => {

        parts = input.value.split("://");
        if(parts.length < 2 || (parts[0] != 'http' && parts[0] != 'https')){
            warn.classList.remove('hidden');
        }else{
            warn.classList.add('hidden');
            fetch(`/getshort?url=${input.value}`).then(async(resp)=>{
                output.children[1].classList.add('hidden');
                shortLink = await resp.text();
                output.firstElementChild.innerText = shortLink;
                output.classList.remove("hidden");
            });    
        }

        });

};