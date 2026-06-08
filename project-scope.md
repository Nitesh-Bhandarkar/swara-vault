## Problem Statement :
People persuing music have a scattered content which becomes difficult to gather the data over the period of time. There is a need to have an application which is like a one stop place to get the info regarding the music. Target music type is Carnatic music. 

## Requirement :
- Build a UI to add details about a particular Raga.
- Raga contains following info :
  1. Name (string)
  2. Janya (boolean type yes / no)
  3. If Janya is Yes, then Janaka is a field to be captured which will be another Raga.
  4. If Jany is No, then Melakarta is a field to be captured which will be a whole number (1 - 76)
  5. Arohana (string) 
  6. Accept a mp3 file for Arohana(optional)
  7. Avarohana (string)
  8. Accept a mp3 file for Avarohana(optional)
  9. Geethe (List of content [name : string, tala : string, description : string, mp3])
  10. Kruthi (List of content [name : string, tala : string, description : string, mp3])
  11. Keertane (List of content [name : string, tala : string, description : string, mp3])
  12. Varna (List of content [name : string, tala : string, description : string, mp3])

- Allow file upload option to fill the data. 
- In the UI page, the value of Janaka is another raga, on click of which should navigate to that particular Raga