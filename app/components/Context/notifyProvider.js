import {useContext} from 'react';
import NotifyContext from './notifyContext';

const useNotify = () => useContext(NotifyContext)[0];
const useDispatchNotify = () => useContext(NotifyContext)[1];

export {useNotify, useDispatchNotify};
