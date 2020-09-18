#!/bin/bash
# Setting up conductor
#npm start
open "http://nuum.nuum.co/conductor"
open "http://nuum.nuum.co/usher"

for i in {0..10}
do
  open -na "Google Chrome" --args --new-window "http://nuum.nuum.co"
done
exit 0
