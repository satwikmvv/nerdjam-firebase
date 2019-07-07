//shuda used typescript to skip this empty and null checks - too late for regrets now and firebase should use es6 already, writing if blocks..bleh!
const isEmpty = (string) => {
    if(string.trim() == '') return true;
    else return false;
}

const isEmail = (email) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regex)) return true
    else return false;
}

exports.validateSignUp = (data) => {
    let errors = {};
    if(isEmpty(data.email)){
        errors.email = 'Email must not be empty!'
    }
    else if(!isEmail(data.email)){
        errors.email = 'Must be valid email'
    }
    
    if(isEmpty(data.password)){
        errors.password = 'password must not be empty!'
    }
    if(isEmpty(data.handle)){
        errors.handle = 'handle must not be empty!'
    }

    if(data.password !== data.confirmPassword) errors.confirmPassword = 'passwords not matched!'


    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLogIn = (user) => {
    let errors = {};
    if(isEmpty(user.email)){
        errors.email = 'Email must not be empty!'
    }
    else if(!isEmail(user.email)){
        errors.email = 'Must be valid email'
    }
    
    if(isEmpty(user.password)){
        errors.password = 'password must not be empty!'
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceUserDetails = (data) => {
    let userDetails ={};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())) {
        if(!data.website.trim().includes('http')) {
            userDetails.website = `http://${data.website.trim()}`
        }
        else userDetails.website = data.website;
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
}