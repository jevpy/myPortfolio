---
layout: ../../layouts/BlogPost.astro
title: "Historical: Microsoft Outages!"
description: The Blue Screen of Death have appeared on the different companies' devices
slug: historical-windows-outages
image: /images/microsoft-outage.png
date: "2024-07-19"
tags: []
type: default
---

# Historical: Microsoft Outages!
Today we are living an incredible and unexpected technological journey. At the beginning of the day, many computers had the Blue Screen of Death (BSOD). Governments, healthcare companies, marketplaces, banks, airports, etc.

## How did it happen this?
This incredible incident occurred for the cybersecurity company “CrowdStrike”, which provides antivirus software for Windows and other companies. Microsoft during the incredibly terrible tech season. said on social media, "The underlying cause has been fixed, however, residual impact is continuing to affect some Microsoft 365 apps and services. We're conducting additional mitigations to provide relief". Also the CEO of CrowdStrike, Kurtz said: "CrowdStrike is actively working with customers impacted by a defect found in a single content update for Windows hosts. Mac and Linux hosts are not impacted.".

After many governments have been concerned that this problem was caused by a cyberattack, the company also said, "This is not a security incident or cyberattack. The issue has been identified, isolated and a fix has been deployed."

#### Details
CrowdStrike security update have installed their product called Falcon Sensor, this is a network sensor to detect and prevent threads, in the morning the company in order to prevent cyber attacks threads used this patch.

Then, Microsoft's Azure cloud platform had a crash that affected some companies and blocked access to their storage applications and Microsoft 365, at 4:09 (UTC) Windows virtual machines were rebooting and crashing. Google was the first to report and identified that the problem was CrowdStrike.

For the reasons I mentioned, maybe your personal computers were not affected, as only users of windows 365 and similar windows cloud services were affected.

#### How are companies affected?
Many companies have had to stop and their daily operations because it was impossible to operate and solve the problem instantly. The customers of the windows service are very worried, so this has suspended important services such as medical assistance, banking transactions, travel, media, etc. The prestigious British media as “Sky News” showed a message where they said that the transmission was suspended.

Below are some headlines of affected services:

- About 1,500 US flights canceled by late morning, FlightAware says 

- Some US TV stations couldn’t air local news 

- Universal Studios Japan says ticket sales are affected 

- Japan’s Jetstar cancels mostly domestic flights 

- More than 100 flights cancelled at New York airports

If you want to read more information about the problems, I give them these link:
- [https://apnews.com/live/internet-global-outage-crowdstrike-microsoft-downtime](https://apnews.com/live/internet-global-outage-crowdstrike-microsoft-downtime)

- [https://www.bbc.com/news/live/cnk4jdwp49et](https://www.bbc.com/news/live/cnk4jdwp49et)


## Who are CrowdStrike?
Right now, we know who are responsible for the global outages, but it is relevant to add that they have a lot of experience and confidence with the most important cyber attacks in defense of the US government, they have participated in defending the US against Chinese and Russian military hacker attacks. They also collaborate with other famous operating systems such as Linux and MacOS. 

They had a good reputation with high profile companies like Sony, maybe after this serious global incident their reputation may be affected. 

It is incredible how a simple update has affected thousands of machines, the most important companies when they started to have incidents with BSOD, they have been surprised that CrowdStrike had a predefined message, because they had many requests from all over the world, this company made known that they recognized this situation and they were working hard to solve it.  

## How can BSOD be fixed?
Currently, all devices affected have that to figure out manually using these process: 
How to fix Blue Screen of Death and “Recovery”, “It looks like Windows didn’t load correctly” loop caused by CrowdStrike.

#### Use Safe Mode and delete the affected file

1. You’ll need to boot to the Safe mode to follow the process. If you’re on the Recovery screen, click on “See advanced repair options” on the Recovery screen. In the Advanced Repair Options menu, select “Troubleshoot,” then choose “Advanced options.” Select “Startup Settings” and click “Restart.” After your PC restarts, press 4 or F4 to start your PC in Safe Mode. Alternatively, you can also shut down the PC, turn it on, and repeatedly press F8 until the Advanced Boot Options menu. From there, select Safe mode.

1. In Safe mode, open Command Prompt (admin) or Windows PowerShell (Admin).

1. In the Command Prompt, type the following command to navigate to the CrowdStrike directory: ***cd  C:\Windows\System32\drivers\CrowdStrike***

1. To delete the affected file, you need to locate the file that matches the pattern C-00000291*.sys.

1. First, run the following command to find the file matching the pattern: ***dir C-00000291*.sys.***

1. Once you’ve identified the file, delete it using:  ***del C-00000291.sys***.

More information of the solution in this link: [https://www.windowslatest.com/2024/07/19/windows-10-crashes-with-bsod-stuck-at-recovery-due-to-crowdstrike-update/](https://www.windowslatest.com/2024/07/19/windows-10-crashes-with-bsod-stuck-at-recovery-due-to-crowdstrike-update/)

#### Another method using code in github
People have created an open source solution where you can view and apply to save time. This option has not yet been tested for its real effectiveness. You can get it in this repo: [https://github.com/panxos/CrowdStrike-rollback](https://github.com/panxos/CrowdStrike-rollback)


## Conclusion
In fact, the major technology outages have not yet been resolved, many experts said the consequences could be dire. Some people said CrowdStrike's stock could decline by more than 15% in the stock market, also the company could lose reputation. Horrible day for the world, a lot of chaos and uncertainty of customers and people in general. These questions need to be asked: How much can we depend on the software? How did a simple code affect everyone? In my opinion, it is complicated to find the answer.  

Official communicated of CrowdStrake: 
- [https://www.crowdstrike.com/blog/statement-on-falcon-content-update-for-windows-hosts/](https://www.crowdstrike.com/blog/statement-on-falcon-content-update-for-windows-hosts/)

- [https://x.com/George_Kurtz/status/1814235001745027317](https://x.com/George_Kurtz/status/1814235001745027317)

Some articles of digital media: 
- [https://www.nbcnews.com/tech/tech-news/microsoft-blue-screen-of-death-global-outage-rcna162674](https://www.nbcnews.com/tech/tech-news/microsoft-blue-screen-of-death-global-outage-rcna162674)

- [https://www.theguardian.com/australia-news/article/2024/jul/19/microsoft-windows-pcs-outage-blue-screen-of-death](https://www.theguardian.com/australia-news/article/2024/jul/19/microsoft-windows-pcs-outage-blue-screen-of-death)

- [https://www.nytimes.com/2024/07/19/business/microsoft-outage-cause-azure-crowdstrike.html](https://www.nytimes.com/2024/07/19/business/microsoft-outage-cause-azure-crowdstrike.html)

- [https://www.theverge.com/2024/7/19/24201806/microsoft-windows-bsod-pc-crashing-crowdstrike-fix](https://www.theverge.com/2024/7/19/24201806/microsoft-windows-bsod-pc-crashing-crowdstrike-fix)

- [https://www.cbsnews.com/news/microsoft-internet-outages-reported-worldwide/](https://www.cbsnews.com/news/microsoft-internet-outages-reported-worldwide/)














