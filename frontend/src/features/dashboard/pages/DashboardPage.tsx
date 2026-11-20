import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Shield, LogOut, User, HeartPulse, FileText, Pill,
    AlertTriangle, Lock, Unlock, CheckCircle2, XCircle, Plus,
    Search, Clock, RefreshCw, FileCheck
} from 'lucide-react';
import type { Patient, CreatePatientInput } from '../../patients/types/patient.types';
import type {
    Observation, CreateObservationInput,
    Condition, CreateConditionInput,
    Prescription, CreatePrescriptionInput
} from '../../clinical/types/clinical.types';
import type { BreakGlassEvent } from '../../emergency/types/emergency.types';
import type { AuditLog } from '../../audit/types/audit.types';
import { getPatientsApi, createPatientApi } from '../../patients/api/patient.api';
import {
    getPatientObservationsApi, recordObservationApi,
    getPatientConditionsApi, diagnoseConditionApi,
    getPatientPrescriptionsApi, createPrescriptionApi
} from '../../clinical/api/clinical.api';
import {
    declareBreakGlassApi, checkActiveBreakGlassApi,
    listBreakGlassEventsApi, reviewBreakGlassApi
} from '../../emergency/api/emergency.api';
import { getAuditLogsApi } from '../../audit/api/audit.api';

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'observations' | 'conditions' | 'prescriptions'>('observations');

    const [observations, setObservations] = useState<Observation[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [breakGlassStatus, setBreakGlassStatus] = useState<{ hasActiveOverride: boolean; remainingMinutes: number } | null>(null);

    const [breakGlassEvents, setBreakGlassEvents] = useState<BreakGlassEvent[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditorTab, setAuditorTab] = useState<'break-glass' | 'logs'>('break-glass');

    const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
    const [breakGlassJustification, setBreakGlassJustification] = useState('');
    const [breakGlassDuration, setBreakGlassDuration] = useState(60);

    const [showObservationModal, setShowObservationModal] = useState(false);
    const [observationForm, setObservationForm] = useState<CreateObservationInput>({
        patientId: 0,
        observationType: 'Blood Pressure',
        value: '',
        unit: 'mmHg',
        interpretation: 'Normal',
        note: ''
    });

    const [showConditionModal, setShowConditionModal] = useState(false);
    const [conditionForm, setConditionForm] = useState<CreateConditionInput>({
        patientId: 0,
        icd10Code: '',
        displayName: '',
        clinicalStatus: 'active',
        confidentialityLevel: 'normal',
        notes: ''
    });

    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [prescriptionForm, setPrescriptionForm] = useState<CreatePrescriptionInput>({
        patientId: 0,
        medicationName: '',
        dosage: '',
        frequency: '',
        route: 'Oral',
        status: 'active',
        instructions: ''
    });

    const [showPatientModal, setShowPatientModal] = useState(false);
    const [patientForm, setPatientForm] = useState<CreatePatientInput>({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        nationalId: '',
        phoneNumber: '',
        bloodType: 'O+',
        allergies: '',
        emergencyContact: ''
    });

    const [reviewModalEvent, setReviewModalEvent] = useState<BreakGlassEvent | null>(null);
    const [reviewStatus, setReviewStatus] = useState<'approved' | 'flagged'>('approved');
    const [reviewNotes, setReviewNotes] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loadingData, setLoadingData] = useState(false);

    const loadAuditorData = useCallback(async () => {
        try {
            setLoadingData(true);
            const [events, logs] = await Promise.all([
                listBreakGlassEventsApi(),
                getAuditLogsApi()
            ]);
            setBreakGlassEvents(events);
            setAuditLogs(logs);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to load auditor records');
        } finally {
            setLoadingData(false);
        }
    }, []);

    const loadPatients = useCallback(async () => {
        try {
            setLoadingData(true);
            const data = await getPatientsApi();
            setPatients(data);
            if (data.length > 0 && !selectedPatient) {
                setSelectedPatient(data[0]);
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to load patient list');
        } finally {
            setLoadingData(false);
        }
    }, [selectedPatient]);

    const loadClinicalRecords = useCallback(async (patientId: number) => {
        try {
            setLoadingData(true);
            const [obs, conds, rxs] = await Promise.all([
                getPatientObservationsApi(patientId),
                getPatientConditionsApi(patientId),
                getPatientPrescriptionsApi(patientId)
            ]);
            setObservations(obs);
            setConditions(conds);
            setPrescriptions(rxs);

            if (user?.role === 'doctor') {
                const bgInfo = await checkActiveBreakGlassApi(patientId);
                setBreakGlassStatus({
                    hasActiveOverride: bgInfo.hasActiveOverride,
                    remainingMinutes: bgInfo.event?.remainingMinutes || 0
                });
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to retrieve patient clinical records');
        } finally {
            setLoadingData(false);
        }
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === 'auditor') {
            loadAuditorData();
        } else {
            loadPatients();
        }
    }, [user?.role, loadAuditorData, loadPatients]);

    useEffect(() => {
        if (selectedPatient) {
            loadClinicalRecords(selectedPatient.patientId);
        }
    }, [selectedPatient, loadClinicalRecords]);

    const handleDeclareBreakGlass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;
        try {
            const result = await declareBreakGlassApi({
                patientId: selectedPatient.patientId,
                justification: breakGlassJustification,
                accessDurationMinutes: Number(breakGlassDuration)
            });
            setSuccessMessage(`Emergency Break-Glass authorized until ${new Date(result.expiredAt).toLocaleTimeString()}`);
            setShowBreakGlassModal(false);
            setBreakGlassJustification('');
            loadClinicalRecords(selectedPatient.patientId);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to activate Break-Glass emergency override');
        }
    };

    const handleCreateObservation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;
        try {
            await recordObservationApi({
                ...observationForm,
                patientId: selectedPatient.patientId
            });
            setSuccessMessage('Vital observation successfully recorded and audited');
            setShowObservationModal(false);
            setObservationForm({
                patientId: 0,
                observationType: 'Blood Pressure',
                value: '',
                unit: 'mmHg',
                interpretation: 'Normal',
                note: ''
            });
            loadClinicalRecords(selectedPatient.patientId);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to record observation');
        }
    };

    const handleDiagnoseCondition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;
        try {
            await diagnoseConditionApi({
                ...conditionForm,
                patientId: selectedPatient.patientId
            });
            setSuccessMessage('Clinical condition diagnosed and secured');
            setShowConditionModal(false);
            setConditionForm({
                patientId: 0,
                icd10Code: '',
                displayName: '',
                clinicalStatus: 'active',
                confidentialityLevel: 'normal',
                notes: ''
            });
            loadClinicalRecords(selectedPatient.patientId);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to diagnose condition');
        }
    };

    const handleCreatePrescription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;
        try {
            await createPrescriptionApi({
                ...prescriptionForm,
                patientId: selectedPatient.patientId
            });
            setSuccessMessage('Prescription medication ordered successfully');
            setShowPrescriptionModal(false);
            setPrescriptionForm({
                patientId: 0,
                medicationName: '',
                dosage: '',
                frequency: '',
                route: 'Oral',
                status: 'active',
                instructions: ''
            });
            loadClinicalRecords(selectedPatient.patientId);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to order prescription');
        }
    };

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newPat = await createPatientApi(patientForm);
            setSuccessMessage(`Patient ${newPat.firstName} ${newPat.lastName} registered successfully`);
            setShowPatientModal(false);
            setPatientForm({
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                gender: 'male',
                nationalId: '',
                phoneNumber: '',
                bloodType: 'O+',
                allergies: '',
                emergencyContact: ''
            });
            loadPatients();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to register patient');
        }
    };

    const handleReviewBreakGlass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewModalEvent) return;
        try {
            await reviewBreakGlassApi(reviewModalEvent.eventId, {
                status: reviewStatus,
                auditorNotes: reviewNotes
            });
            setSuccessMessage(`Break-Glass Event #${reviewModalEvent.eventId} marked as ${reviewStatus.toUpperCase()}`);
            setReviewModalEvent(null);
            setReviewNotes('');
            loadAuditorData();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to submit review');
        }
    };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nationalId.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-base tracking-wide text-white flex items-center gap-2">
                            <span>MedShield-EHR</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                ISO 27799 / HL7 FHIR
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-white">{user?.username}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {user?.role}
                        </span>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>

            {errorMessage && (
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-200">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {user?.role === 'auditor' ? (
                <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-emerald-400" />
                                <span>Security & Compliance Audit Dashboard</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                ISO 27799 / NIST SP 800-63B Tamper-evident Audit Trail and Break-Glass Review
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAuditorTab('break-glass')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                    auditorTab === 'break-glass'
                                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Break-Glass Overrides ({breakGlassEvents.filter(e => e.auditorReviewStatus === 'pending').length} Pending)
                            </button>
                            <button
                                onClick={() => setAuditorTab('logs')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                    auditorTab === 'logs'
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Tamper-Evident Audit Trail ({auditLogs.length})
                            </button>
                            <button
                                onClick={loadAuditorData}
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                title="Refresh Logs"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {auditorTab === 'break-glass' ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Event ID</th>
                                            <th className="py-3 px-4">Doctor</th>
                                            <th className="py-3 px-4">Patient</th>
                                            <th className="py-3 px-4">Clinical Justification</th>
                                            <th className="py-3 px-4">Duration</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Reviewer</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {breakGlassEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-500">
                                                    No emergency break-glass events found.
                                                </td>
                                            </tr>
                                        ) : (
                                            breakGlassEvents.map((evt) => (
                                                <tr key={evt.eventId} className="hover:bg-slate-800/30">
                                                    <td className="py-3 px-4 font-mono font-medium text-slate-300">#{evt.eventId}</td>
                                                    <td className="py-3 px-4 font-semibold text-white">{evt.doctorUsername}</td>
                                                    <td className="py-3 px-4 text-slate-300">{evt.patientName} (ID: {evt.patientId})</td>
                                                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={evt.justification}>
                                                        {evt.justification}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-slate-500" />
                                                            {evt.accessDurationMinutes} min
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            evt.auditorReviewStatus === 'approved'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                : evt.auditorReviewStatus === 'flagged'
                                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                            {evt.auditorReviewStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400">
                                                        {evt.auditorUsername ? (
                                                            <div>
                                                                <span className="text-white font-medium">{evt.auditorUsername}</span>
                                                                <div className="text-[10px] text-slate-500 truncate max-w-xs">{evt.auditorNotes}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-600">Pending Review</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setReviewModalEvent(evt);
                                                                setReviewStatus(evt.auditorReviewStatus === 'flagged' ? 'flagged' : 'approved');
                                                                setReviewNotes(evt.auditorNotes || '');
                                                            }}
                                                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs border border-slate-700"
                                                        >
                                                            Audit Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Log ID</th>
                                            <th className="py-3 px-4">Timestamp</th>
                                            <th className="py-3 px-4">User</th>
                                            <th className="py-3 px-4">Action</th>
                                            <th className="py-3 px-4">Resource</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">IP Address</th>
                                            <th className="py-3 px-4 font-mono">SHA-256 Hash</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {auditLogs.map((log) => (
                                            <tr key={log.logId} className="hover:bg-slate-800/30">
                                                <td className="py-3 px-4 font-mono font-medium text-slate-400">#{log.logId}</td>
                                                <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-white">{log.username}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{log.role}</div>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{log.action}</td>
                                                <td className="py-3 px-4 text-slate-300">{log.resourceType} (#{log.resourceId})</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        log.status === 'SUCCESS'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : log.status === 'UNAUTHORIZED'
                                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                                                <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={log.logHash}>
                                                    {log.logHash}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {user?.role !== 'patient' && (
                        <aside className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
                            <div className="p-4 border-b border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-emerald-400" />
                                        <span>Patients ({patients.length})</span>
                                    </h2>
                                    <button
                                        onClick={() => setShowPatientModal(true)}
                                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                                        title="Register Patient"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>New</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                                {filteredPatients.map((pat) => (
                                    <div
                                        key={pat.patientId}
                                        onClick={() => setSelectedPatient(pat)}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            selectedPatient?.patientId === pat.patientId
                                                ? 'bg-slate-800/80 border-l-2 border-emerald-400'
                                                : 'hover:bg-slate-850/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm text-white">
                                                {pat.firstName} {pat.lastName}
                                            </span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                                {pat.bloodType}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                                            <span>DOB: {new Date(pat.dateOfBirth).toLocaleDateString()}</span>
                                            <span className="capitalize">{pat.gender}</span>
                                        </div>
                                        <div className="text-[11px] font-mono text-slate-500 mt-1">
                                            National ID: {pat.nationalId}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    )}

                    <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
                        {selectedPatient ? (
                            <>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-xl font-bold text-white">
                                                {selectedPatient.firstName} {selectedPatient.lastName}
                                            </h1>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Patient #{selectedPatient.patientId}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                                            <div>DOB: <strong className="text-slate-200">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</strong></div>
                                            <div>Gender: <strong className="text-slate-200 capitalize">{selectedPatient.gender}</strong></div>
                                            <div>Blood: <strong className="text-slate-200">{selectedPatient.bloodType}</strong></div>
                                            <div>Phone: <strong className="text-slate-200">{selectedPatient.phoneNumber}</strong></div>
                                            <div>National ID: <strong className="text-slate-200 font-mono">{selectedPatient.nationalId}</strong></div>
                                        </div>
                                        {selectedPatient.allergies && (
                                            <div className="text-xs text-rose-300 mt-2 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                                <span>Allergies: <strong>{selectedPatient.allergies}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {user?.role === 'doctor' && (
                                        <div className="flex items-center gap-3">
                                            {breakGlassStatus?.hasActiveOverride ? (
                                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium">
                                                    <Unlock className="w-4 h-4 text-emerald-400" />
                                                    <span>Break-Glass Active ({breakGlassStatus.remainingMinutes} min)</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowBreakGlassModal(true)}
                                                    className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                >
                                                    <Lock className="w-4 h-4 text-rose-400" />
                                                    <span>Declare Break-Glass Override</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setActiveTab('observations')}
                                            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                                                activeTab === 'observations'
                                                    ? 'border-emerald-400 text-emerald-400'
                                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <HeartPulse className="w-4 h-4" />
                                            <span>Observations & Vitals ({observations.length})</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('conditions')}
                                            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                                                activeTab === 'conditions'
                                                    ? 'border-emerald-400 text-emerald-400'
                                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Conditions ({conditions.length})</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('prescriptions')}
                                            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                                                activeTab === 'prescriptions'
                                                    ? 'border-emerald-400 text-emerald-400'
                                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <Pill className="w-4 h-4" />
                                            <span>Prescriptions ({prescriptions.length})</span>
                                        </button>
                                    </div>

                                    {(user?.role === 'doctor' || user?.role === 'nurse') && (
                                        <div className="pb-2">
                                            {activeTab === 'observations' && (
                                                <button
                                                    onClick={() => setShowObservationModal(true)}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Record Vital</span>
                                                </button>
                                            )}
                                            {activeTab === 'conditions' && user?.role === 'doctor' && (
                                                <button
                                                    onClick={() => setShowConditionModal(true)}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Diagnose Condition</span>
                                                </button>
                                            )}
                                            {activeTab === 'prescriptions' && user?.role === 'doctor' && (
                                                <button
                                                    onClick={() => setShowPrescriptionModal(true)}
                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Order Prescription</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'observations' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {observations.length === 0 ? (
                                            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                                                No vital observations recorded for this patient.
                                            </div>
                                        ) : (
                                            observations.map((obs) => (
                                                <div key={obs.observationId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                                        <span className="font-semibold text-white">{obs.observationType}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            obs.interpretation === 'Critical'
                                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                : obs.interpretation === 'High' || obs.interpretation === 'Low'
                                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {obs.interpretation}
                                                        </span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-white flex items-baseline gap-1 my-2">
                                                        <span>{obs.value}</span>
                                                        <span className="text-xs text-slate-400 font-normal">{obs.unit}</span>
                                                    </div>
                                                    {obs.note && (
                                                        <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2 rounded border border-slate-850">
                                                            {obs.note}
                                                        </p>
                                                    )}
                                                    <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                                                        <span>Recorded by: {obs.recordedByUsername} ({obs.recordedByRole})</span>
                                                        <span>{new Date(obs.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'conditions' && (
                                    <div className="space-y-3">
                                        {conditions.length === 0 ? (
                                            <div className="py-12 text-center text-slate-500 text-xs">
                                                No clinical conditions diagnosed for this patient.
                                            </div>
                                        ) : (
                                            conditions.map((cond) => (
                                                <div
                                                    key={cond.conditionId}
                                                    className={`p-4 rounded-xl border transition-all ${
                                                        cond.requiresBreakGlass
                                                            ? 'bg-rose-950/20 border-rose-500/30'
                                                            : 'bg-slate-900 border-slate-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                                                                {cond.icd10Code}
                                                            </span>
                                                            <h3 className="font-semibold text-sm text-white">
                                                                {cond.displayName}
                                                            </h3>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                cond.confidentialityLevel === 'restricted'
                                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                    : 'bg-slate-800 text-slate-400'
                                                            }`}>
                                                                {cond.confidentialityLevel}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                                                                {cond.clinicalStatus}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 text-xs">
                                                        {cond.requiresBreakGlass ? (
                                                            <div className="flex items-center justify-between bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-300">
                                                                <div className="flex items-center gap-2">
                                                                    <Lock className="w-4 h-4 text-rose-400" />
                                                                    <span>{cond.notes}</span>
                                                                </div>
                                                                {user?.role === 'doctor' && (
                                                                    <button
                                                                        onClick={() => setShowBreakGlassModal(true)}
                                                                        className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded text-xs"
                                                                    >
                                                                        Break-Glass
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            cond.notes && (
                                                                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-slate-300">
                                                                    <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                                                                        Clinical Assessment Notes (AES-256 Decrypted)
                                                                    </div>
                                                                    {cond.notes}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>

                                                    <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                                                        <span>Diagnosed by: {cond.doctorUsername}</span>
                                                        <span>Diagnosed on: {cond.diagnosedAt ? new Date(cond.diagnosedAt).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'prescriptions' && (
                                    <div className="space-y-3">
                                        {prescriptions.length === 0 ? (
                                            <div className="py-12 text-center text-slate-500 text-xs">
                                                No active prescriptions recorded for this patient.
                                            </div>
                                        ) : (
                                            prescriptions.map((rx) => (
                                                <div key={rx.prescriptionId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Pill className="w-4 h-4 text-emerald-400" />
                                                            <h3 className="font-semibold text-sm text-white">
                                                                {rx.medicationName} ({rx.dosage})
                                                            </h3>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            {rx.status}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                                                        <div>
                                                            <span className="text-slate-500">Frequency:</span> <span className="text-slate-200">{rx.frequency}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Route:</span> <span className="text-slate-200">{rx.route}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Related Condition:</span> <span className="text-slate-200">{rx.conditionName || 'None'}</span>
                                                        </div>
                                                    </div>

                                                    {rx.instructions && (
                                                        <p className="text-xs text-slate-300 mt-2">
                                                            <strong className="text-slate-400">Instructions:</strong> {rx.instructions}
                                                        </p>
                                                    )}

                                                    <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                                                        <span>Prescribing Doctor: {rx.doctorUsername}</span>
                                                        <span>Ordered on: {rx.prescribedAt ? new Date(rx.prescribedAt).toLocaleString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-24 text-center text-slate-500 text-xs">
                                No patient selected.
                            </div>
                        )}
                    </main>
                </div>
            )}

            {showBreakGlassModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-rose-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-rose-400 mb-4 pb-3 border-b border-slate-800">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <div>
                                <h2 className="text-base font-bold text-white">Emergency Break-Glass Override</h2>
                                <p className="text-xs text-slate-400">Strictly monitored under ISO 27799 Emergency Protocol</p>
                            </div>
                        </div>

                        <form onSubmit={handleDeclareBreakGlass} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                    Clinical Justification (Mandatory)
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    minLength={10}
                                    placeholder="State emergency medical rationale (e.g., Acute trauma resuscitation with unconscious patient requiring immediate psychiatric/toxicology history)..."
                                    value={breakGlassJustification}
                                    onChange={(e) => setBreakGlassJustification(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                    Access Duration
                                </label>
                                <select
                                    value={breakGlassDuration}
                                    onChange={(e) => setBreakGlassDuration(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                                >
                                    <option value={30}>30 Minutes</option>
                                    <option value={60}>60 Minutes (Standard)</option>
                                    <option value={120}>120 Minutes (Extended Emergency)</option>
                                </select>
                            </div>

                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-300 leading-relaxed">
                                WARNING: Triggering this override generates an unalterable SHA-256 audit entry flagged for compliance review.
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowBreakGlassModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                    Confirm Emergency Access
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showObservationModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-emerald-400" />
                            <span>Record Vital Observation</span>
                        </h2>

                        <form onSubmit={handleCreateObservation} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Observation Type</label>
                                <input
                                    required
                                    type="text"
                                    value={observationForm.observationType}
                                    onChange={(e) => setObservationForm({ ...observationForm, observationType: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="120/80"
                                        value={observationForm.value}
                                        onChange={(e) => setObservationForm({ ...observationForm, value: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Unit</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="mmHg"
                                        value={observationForm.unit}
                                        onChange={(e) => setObservationForm({ ...observationForm, unit: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Interpretation</label>
                                <select
                                    value={observationForm.interpretation}
                                    onChange={(e) => setObservationForm({ ...observationForm, interpretation: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="High">High</option>
                                    <option value="Low">Low</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Clinical Note (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Patient sitting relaxed"
                                    value={observationForm.note || ''}
                                    onChange={(e) => setObservationForm({ ...observationForm, note: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowObservationModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                    Save Observation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showConditionModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            <span>Diagnose Clinical Condition</span>
                        </h2>

                        <form onSubmit={handleDiagnoseCondition} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">ICD-10 Code</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="I10"
                                        value={conditionForm.icd10Code}
                                        onChange={(e) => setConditionForm({ ...conditionForm, icd10Code: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Clinical Status</label>
                                    <select
                                        value={conditionForm.clinicalStatus}
                                        onChange={(e) => setConditionForm({ ...conditionForm, clinicalStatus: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Display Name / Condition</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Essential (primary) hypertension"
                                    value={conditionForm.displayName}
                                    onChange={(e) => setConditionForm({ ...conditionForm, displayName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Confidentiality Level</label>
                                <select
                                    value={conditionForm.confidentialityLevel}
                                    onChange={(e) => setConditionForm({ ...conditionForm, confidentialityLevel: e.target.value as any })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="restricted">Restricted (Requires Break-Glass)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Diagnostic Notes (AES-256 Encrypted)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Detailed clinical evaluation notes..."
                                    value={conditionForm.notes || ''}
                                    onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowConditionModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                    Save Condition
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPrescriptionModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                            <Pill className="w-5 h-5 text-emerald-400" />
                            <span>Order Medication Prescription</span>
                        </h2>

                        <form onSubmit={handleCreatePrescription} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Medication Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Amlodipine"
                                    value={prescriptionForm.medicationName}
                                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicationName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Dosage</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="5 mg"
                                        value={prescriptionForm.dosage}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Route</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Oral"
                                        value={prescriptionForm.route}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, route: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Frequency</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Once daily in the morning"
                                    value={prescriptionForm.frequency}
                                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Instructions</label>
                                <textarea
                                    rows={2}
                                    placeholder="Take with or without food..."
                                    value={prescriptionForm.instructions || ''}
                                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowPrescriptionModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                    Order Medication
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPatientModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            <span>Register New Patient</span>
                        </h2>

                        <form onSubmit={handleCreatePatient} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={patientForm.firstName}
                                        onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={patientForm.lastName}
                                        onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Date of Birth</label>
                                    <input
                                        required
                                        type="date"
                                        value={patientForm.dateOfBirth}
                                        onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                                    <select
                                        value={patientForm.gender}
                                        onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">National ID (AES-256-GCM Encrypted)</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="13-digit National ID or Passport"
                                    value={patientForm.nationalId}
                                    onChange={(e) => setPatientForm({ ...patientForm, nationalId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="0812345678"
                                        value={patientForm.phoneNumber}
                                        onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Blood Type</label>
                                    <select
                                        value={patientForm.bloodType}
                                        onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Known Allergies (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Penicillin, NSAIDs, etc."
                                    value={patientForm.allergies || ''}
                                    onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Emergency Contact (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Jane Doe (0899999999)"
                                    value={patientForm.emergencyContact || ''}
                                    onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowPatientModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                    Register Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {reviewModalEvent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-emerald-400" />
                            <span>Audit Review: Break-Glass Event #{reviewModalEvent.eventId}</span>
                        </h2>
                        <div className="text-xs text-slate-400 mb-4 bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1">
                            <div>Doctor: <strong className="text-white">{reviewModalEvent.doctorUsername}</strong></div>
                            <div>Patient: <strong className="text-white">{reviewModalEvent.patientName}</strong></div>
                            <div>Justification: <strong className="text-slate-300">{reviewModalEvent.justification}</strong></div>
                        </div>

                        <form onSubmit={handleReviewBreakGlass} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Review Decision</label>
                                <select
                                    value={reviewStatus}
                                    onChange={(e) => setReviewStatus(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="approved">Approved (Valid Clinical Emergency)</option>
                                    <option value="flagged">Flagged (Requires Clinical Governance Investigation)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Auditor Compliance Notes</label>
                                <textarea
                                    required
                                    rows={3}
                                    minLength={5}
                                    placeholder="Enter audit findings and rationale..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalEvent(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                    Submit Audit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
