"""Small source-policy tests; no network or large dictionary downloads needed."""
import importlib.util
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location("importer", Path(__file__).with_name("import-japanese.py"))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)

class ExamplePolicyTests(unittest.TestCase):
    def entry(self, written_info="", reading_info="", priority="<ke_pri>news1</ke_pri>", restriction=""):
        return ET.fromstring(f"""<entry><k_ele><keb>一向</keb>{priority}{written_info}</k_ele>
        <r_ele><reb>ひたすら</reb>{reading_info}{restriction}</r_ele>
        <sense><gloss>earnestly</gloss></sense></entry>""")

    def test_all_blocked_writing_tags(self):
        for tag in importer.BAD_WRITING:
            self.assertEqual(importer.common_pairs(self.entry(written_info=f"<ke_inf>{tag}</ke_inf>")), [])

    def test_all_blocked_reading_tags(self):
        for tag in importer.BAD_READING:
            self.assertEqual(importer.common_pairs(self.entry(reading_info=f"<re_inf>{tag}</re_inf>")), [])

    def test_priority_must_belong_to_that_spelling(self):
        e = self.entry(priority="")
        ET.SubElement(e.find("r_ele"), "re_pri").text = "news1"
        self.assertEqual(importer.common_pairs(e), [])
        ET.SubElement(e, "k_ele").extend([ET.fromstring("<keb>向く</keb>"), ET.fromstring("<ke_pri>news1</ke_pri>")])
        self.assertTrue(all(p[0] != "一向" for p in importer.common_pairs(e)))

    def test_reading_restrictions(self):
        self.assertEqual(importer.common_pairs(self.entry(restriction="<re_restr>別</re_restr>")), [])
        self.assertEqual(len(importer.common_pairs(self.entry(restriction="<re_restr>一向</re_restr>"))), 1)

    def test_sense_restrictions_and_usually_kana(self):
        e = self.entry()
        sense = e.find("sense")
        ET.SubElement(sense, "stagr").text = "いっこう"
        self.assertEqual(importer.pair_meanings(e, "一向", "ひたすら"), [])
        sense.remove(sense.find("stagr"))
        ET.SubElement(sense, "misc").text = "word usually written using kana alone"
        self.assertEqual(importer.pair_meanings(e, "一向", "ひたすら", written_only=True), [])

if __name__ == "__main__":
    unittest.main()
