# Microsoft Cloud Product Logos

This collection of logos has been built up over the years using both official Microsoft logo packages, as well as hard to find places (i.e. scraping websites or blog posts, AppSource, product screens, presentations, and anywhere I can find them).

It originally lived in my OneDrive for use in documents, but then I kept sharing it with colleagues whenever I'd spot an incorrect or dated product logo.

As it continued to grow, I decided it was time for it to live on GitHub instead so the rest of the community can benefit from it, and hopefully contribute.



I'll try to keep this current as possible, and will also retain legacy logos just for the sake of it.

If you have any to add or update any, please feel free to contribute!



Enjoy!

You can also access it by going to www.mscloudlogos.com where you'll find an easy to use interface for sorting and filtering the icons.



## Contributing

When you add or rename logo files, you need to regenerate the GitHub Pages data file to make them visible on the website. Run this command from the repository root:

```bash
python3 generate-logo-data.py
```

This will scan all logo files in the repository and update `docs/js/logo-data.js`, which powers the website at www.mscloudlogos.com.

## File \& folder structure

I have attempted to bring order to the challenge of keeping track of current and legacy logos by applying the following logic:

- Logos are grouped by their (current) product family grouping, as defined by Microsoft marketing (i.e. website).
  - There are some outliers to clear logic here, such as Entra ID being part of Microsoft 365 and Entra suite, or Intune, or Power BI being part of Power Platform and Fabric. I do my best to apply reasoning for these.
- Where multiple versions of a logo exist - older versions are stored in sub-folders prefixed by their years of (official) existence.
- Where a product has been retired entirely - it is moved into the "zzLEGACY logos" folder.
- Where a product has had a significant rename - the old logos are in a sub-folder of the current name, for example:
  - MyAnalytics and Workplace Analytics are found under the Viva Insights folder
  - Yammer is found under the Viva Engage folder
  - Power Virtual Agents is found under the Copilot Studio folder
  - Office is found under the Microsoft 365 Apps folder (note the capital "A")
- Exceptions to the rename logic are where the current product is significantly different from the previous and/or has itself had numerous logo versions (e.g. Skype for Business).







## References and sources

[Azure](https://learn.microsoft.com/en-us/azure/architecture/icons/)

[Dynamics 365](https://learn.microsoft.com/en-us/dynamics365/get-started/icons)

[Entra ID](https://learn.microsoft.com/en-us/entra/architecture/architecture-icons)

[Fabric](https://learn.microsoft.com/en-us/fabric/get-started/icons)

[Power Platform](https://learn.microsoft.com/en-us/power-platform/guidance/icons)

[Viva (courtesy of Viva Explorers)](https://github.com/Viva-Explorers/Viva-Icons)



[Microsoft Trademarks and Branding Guidelines](https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/online/branding)



Disclaimer: I do not work for Microsoft, do not claim copyright or ownership of any of these files. All logos are the property of Microsoft Corporation.

