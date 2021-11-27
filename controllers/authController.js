const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser } = require('../utils');

const register = async (req, res) => {
    const { userName, email, firstName, lastName, password } = req.body;

    const userNameAlreadyExists = await User.findOne({ userName });
    if (userNameAlreadyExists) {
        throw new CustomError.BadRequestError('Username already exists');
    }

    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
        throw new CustomError.BadRequestError('Email already exists');
    }

    const user = await User.create({ firstName, lastName, userName, email, password });
    const tokenUser = createTokenUser(user);;
    attachCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const login = async (req, res) => {
    const { email, userName, password } = req.body;

    if (!email && !userName) {
        throw new CustomError.BadRequestError('Please provide email or username');
    }

    if (!password) {
        throw new CustomError.BadRequestError('Please provide password');
    }

    const user = await User.findOne({ $or: [{ email }, { userName }] });

    if (!user) {
        throw new CustomError.UnauthenticatedError('Invalid email or username');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid password');
    }

    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({ res, user: tokenUser });

    res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
    res.cookie('token', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now() + 1000),
    });

    res.status(StatusCodes.OK).json({ msg: 'User logged out!' });
};

module.exports = {
    register,
    login,
    logout,
};