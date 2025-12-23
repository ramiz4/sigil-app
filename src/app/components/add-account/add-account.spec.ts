import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddAccount } from './add-account';
import { TotpService } from '../../services/totp.service';
import { provideRouter } from '@angular/router';

class MockTotpService {
  async addAccount(data: any) { }
  parseUrl(url: string) { return {}; }
}

describe('AddAccount', () => {
  let component: AddAccount;
  let fixture: ComponentFixture<AddAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAccount],
      providers: [
        provideRouter([]),
        { provide: TotpService, useClass: MockTotpService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
