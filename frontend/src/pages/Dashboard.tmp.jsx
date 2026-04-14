import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Wait! In my previous view, api is in ../services/api
// Let me double check path.
// Previous path: import api from '../services/api';
// The path for Dashboard.jsx is src/pages/Dashboard.jsx
