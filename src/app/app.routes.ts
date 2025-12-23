import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { AddAccount } from './components/add-account/add-account';
import { Settings } from './components/settings/settings';

export const routes: Routes = [
    { path: '', component: Dashboard },
    { path: 'add', component: AddAccount },
    { path: 'settings', component: Settings },
    { path: '**', redirectTo: '' }
];
