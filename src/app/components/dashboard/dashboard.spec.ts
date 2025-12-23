import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { TotpService } from '../../services/totp.service';
import { signal, computed } from '@angular/core';
import { provideRouter } from '@angular/router';

class MockTotpService {
  displayCodes = computed(() => []);
  deleteAccount(id: string) { }
}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: TotpService, useClass: MockTotpService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
