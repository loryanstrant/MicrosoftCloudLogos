# The Big Reorganisation!

Because of the constant nature of Microsoft renaming products and reorganising their alignment, I am making some changes to this repo in order to make it more survivable.
Additionally, some other changes are being made to help make it more integrateable into people's apps and services.

## Key objectives
* Break free of product family categorisation hierarchy and its conflicts (e.g. does Power BI sit under Power Platform, or Fabric, or both?)
* Make it easier for logos to be found by their alternate and former names
* Create consistent logo sizes

## What is happening

### Metadata creation
Each product folder will contain a metadata.md file, which will contain the following fields:
| Field | Description | Required |
| :------------ | :----------- | :------------ |
| name | Current name | Yes |
| type | Product / Family / Feature | Yes |
| status | Active / Retired / Renamed | Yes |
| altnames | Alternative or former names, abbreviations | No |
| prodfamilies | Product family (or families) it is associated with | No |

This metadata will be used by the workflow to build the front-end experience for the www.mscloudlogos.com site.

### Folder & file naming space removal
All files and folders will have their spaces replaced with an underscore (or hyphen, I haven't decided yet) to help with consistency around file names.

### Folder & file name case change
All files and folders will be changed to lowercase, to ensure consistency.

### Hierarchy flattening
All product, family, and feature folders will sit at the top level of the repo (well, most likely under a "Logos" folder).
This will help reduce the chance that any links created by users will not break due to a product reorganisation

### Multiple-version folder naming
All folders will need to contain within them sub-folders that contain the year of the logo. "Old" and "new" are too subjective.

### File padding & image sizing consistency
All products will need to have some consistency around their size, and whether they are padded.
For example, some logos say they are 256x256, but are actually closer to 200x200 if you take away the padding. Whereas others are 256x256 with no padding.
Some files have just "256" or "512" in their file name, others have "256x256" or "512x512" in their file name, and others don't have any dimensions in their file name.

## Azure & Dynamics 365
These two are a big hot mess, because there are a bunch of folders and images which are features and not actual products.
Both of these will need to be sorted out to have some consistency like the other product families.

## Current progress (as of this page being updated)
- [ ] Azure product logo cleanup
- [ ] Dynamics 365 product logo cleanup
- [ ] Metadata files have been created for all products and families
  - [ ] Azure
  - [ ] Copilot (not M365)
  - [ ] Dynamics 365
  - [x] Entra
  - [x] Fabric
  - [x] Microsoft 365
  - [x] Power Platform
  - [x] Viva
  - [x] Other
  - [x] Former products
- [x] Spacing removed from all file & folder names (although, the choice of character might be revisited)
- [ ] Lower casing of all file & folder names
- [ ] Constency of image padding
- [ ] Constency of file naming (in relation to padding, dimensions)
- [ ] Flattening of folder hierarchy
- [ ] Rebuild of website to utilise new functionality and structure


If there's anything unclear in this, it's because I've spent waaaaay too many hours on it today and my wife is glaring at me now as I have to go and make the kids beds!
