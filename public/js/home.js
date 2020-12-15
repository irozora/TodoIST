
const headers = {
	'Content-Type': 'application/json'
};

const signInBtn = document.getElementsByClassName('sign-in-btn')[0];
const signInSubmitBtn = document.getElementsByClassName('sign-in-submit-btn')[0];
const signInForm = document.getElementById('sign-in-form');

const signUpBtn = document.getElementsByClassName('sign-up-btn')[0];
const signUpSubmitBtn = document.getElementsByClassName('sign-up-submit-btn')[0];
const signUpForm = document.getElementById('sign-up-form');

signInBtn.addEventListener('click', showSignInForm)
signInSubmitBtn.addEventListener('click', nativeSignIn)

signUpBtn.addEventListener('click', showSignUpForm)
signUpSubmitBtn.addEventListener('click', signUp)


function showSignUpForm(e) {
    e.preventDefault();
    signUpForm.style.display = 'block';
}

function signUp(e) {
    e.preventDefault();
    const username = document.getElementById('user-sign-up-name');
    const name = username.value.trim();
    if (!name) {
		swal(`Username is required.`);
		return;
    }

    const signUpEmail = document.getElementById('user-sign-up-email');
    const email = signUpEmail.value.trim();
    if (!validator.isEmail(email)) {
		swal(`Email is not valid.`);
		return;
    }

    const signUpPwd = document.getElementById('user-sign-up-password');
    const password = signUpPwd.value.trim();
    if (password.length < 8) {
		swal(`Password should not be less than 8 characters.`);
		return;
    }

    let data = {
        name,
        email,
        password
    }

	fetch(`/api/1.0/user/signup`, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(result => {
        if (result.error) {
	    	swal(result.error);
	    	return;
        } else {
            window.localStorage.setItem('Authorization', `Bearer ${result.data.access_token}`);
            window.location = `/main.html`;
        }
	})
	.catch(error => {
		console.log(error)
	})
}

function showSignInForm(e) {
    e.preventDefault();
    signInForm.style.display = 'block';
}

function nativeSignIn(e) {
    e.preventDefault();
    const signInEmail = document.getElementById('user-sign-in-email');
    const email = signInEmail.value.trim();
    if (!validator.isEmail(email)) {
		swal(`Email is not valid!`);
		return;
    }
    const signInPwd = document.getElementById('user-sign-in-password');
    const password = signInPwd.value.trim();

    let data = {
        provider: 'native',
        email,
        password
    }

    fetch(`/api/1.0/user/signin`, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(result => {
        if (result.error) {
	    	swal(result.error);
	    	return;
        } else {
            window.localStorage.setItem('Authorization', `Bearer ${result.data.access_token}`);
            window.location = `/main.html`;
        }
	})
	.catch(error => {
		console.log(error)
	})
}