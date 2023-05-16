import {useContext} from 'react';
import CanastaContext from './canastaContext';

const useCanasta = () => useContext(CanastaContext)[0];
const useDispatch = () => useContext(CanastaContext)[1];

export {useCanasta, useDispatch};
