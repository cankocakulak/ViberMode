#!/usr/bin/env node
// Reconcile late store files, Creator bonuses, and subscription cohort maturity.
// An unfinished week needs a fresh full reconciliation before finalization.
import fs from 'node:fs';
import path from 'node:path';
import {runLateData} from './weekly-late-data-backfill.mjs';
import {main} from './weekly-app-growth.mjs';
import {weekWindow,addDays} from './growth-scorecard/core.mjs';
const args=process.argv.slice(2),latest=weekWindow();
// Recover an interrupted journal before any publisher checks FINAL manifests.
if(args.includes('--publish'))await runLateData([...args,'--resume-only']);
await main([...args,'--week',latest.start]);
await runLateData(args);
for(const i of [56,55,54,53,52,51,6,5,4,3,2,1]){const date=addDays(latest.start,-7*i);if(fs.existsSync(path.resolve('docs/weekly-app-growth/'+date+'.local.json')))await main([...args,'--week',date]);}
