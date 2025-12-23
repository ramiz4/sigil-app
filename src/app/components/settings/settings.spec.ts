import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { BackupService } from '../../services/backup.service';
import { provideRouter } from '@angular/router';

class MockBackupService {
  async exportBackup(password: string) { }
  async importBackup(file: File, password: string) { return { restored: 0, skipped: 0 }; }
}

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([]),
        { provide: BackupService, useClass: MockBackupService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
