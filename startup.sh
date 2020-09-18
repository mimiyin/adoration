#!/bin/bash
# Setting up conductor
#npm start
open "http://respond.nuum.co/conductor"
open "http://respond.nuum.co/usher"

for i in {0..12}
do
  open -na "Firefox" --args --new-window "http://respond.nuum.co"
done
exit 0
