import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

const firebaseConfig = {
  apiKey: "AIzaSyCCEw52sMk7lkjPSJcnB-T1bCxilcj1axw",
  authDomain: "test-task-a091d.firebaseapp.com",
  projectId: "test-task-a091d",
  storageBucket: "test-task-a091d.appspot.com",
  messagingSenderId: "567760247807",
  appId: "1:567760247807:web:b2d9f702089c9274c8e5ca",
  measurementId: "G-BWPPNEEFE4"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideAnimations(),
    provideHttpClient()
  ]
};